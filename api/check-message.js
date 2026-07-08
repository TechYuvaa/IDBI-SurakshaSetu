import fs from 'fs';
import path from 'path';

// Simple in-memory session counter for LLM calls (persists across requests during server lifetime)
let llmCallCount = 0;

// Helper to load environment variables from .env on disk when process.env doesn't load them automatically
function getEnv(key) {
  if (process.env[key]) return process.env[key];
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split(/\r?\n/);
      for (const line of lines) {
        const [k, ...v] = line.split('=');
        if (k && k.trim() === key) {
          return v.join('=').trim();
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export default async function handler(req, res) {
  // Enforce proper HTTP Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  // Handle missing/malformed request body
  if (!req.body) {
    return res.status(400).json({ error: 'Missing request body.' });
  }

  const { message } = req.body;
  
  // Handle empty or wrong type strings
  if (message === undefined || message === null) {
    return res.status(400).json({ error: 'Message text is required' });
  }

  if (typeof message !== 'string') {
    return res.status(400).json({ error: 'Message payload must be a string.' });
  }

  const trimmedMessage = message.trim();

  // Edge case: Empty input
  if (trimmedMessage.length === 0) {
    return res.status(200).json({
      verdict: 'safe',
      confidence: 95,
      reasons: ['Payload contains no text content.'],
      explanation: 'This input is empty and poses no security threat.'
    });
  }

  // Edge case: Extremely long input (5000+ chars)
  if (trimmedMessage.length >= 5000) {
    return res.status(400).json({ error: 'Payload exceeds maximum safety length of 5000 characters.' });
  }

  // Truncate text for processing if it exceeds a reasonable length for scanner (e.g. 2000 chars)
  const analysisText = trimmedMessage.slice(0, 2000);
  const lowerMessage = analysisText.toLowerCase();

  // Attempt OpenAI Classify if API Key is configured and count is within bounds
  const openAiApiKey = getEnv('OPENAI_API_KEY');
  if (openAiApiKey && llmCallCount < 20) {
    try {
      llmCallCount++;
      const llmResult = await classifyWithLLM(analysisText, openAiApiKey);
      if (llmResult) {
        return res.status(200).json(llmResult);
      }
    } catch (err) {
      console.error('LLM classification failed, falling back to heuristics:', err.message);
      // Silent fallback
    }
  }

  // --- HEURISTIC SCORING ENGINE ---
  let riskScore = 0;
  const reasons = [];

  // Helper helper to detect word matches
  const checkMatches = (patterns) => {
    return patterns.some(pattern => lowerMessage.includes(pattern));
  };

  // 1. Urgency / Threat Language (Weight: 25)
  const urgencyPatterns = ['act now', 'account will be blocked', 'immediately', 'within 24 hours', 'action required', 'expires today', 'immediate suspension', 'freeze'];
  if (checkMatches(urgencyPatterns)) {
    riskScore += 25;
    reasons.push("Creates a false sense of high urgency or threat of account suspension.");
  }

  // 2. Sensitive Information Requests (Weight: 35)
  const sensitivePatterns = ['otp', 'one time password', 'pin', 'cvv', 'card number', 'expiry date', 'password', 'netbanking password', 'login credential'];
  const askWords = ['share', 'send', 'verify', 'provide', 'enter', 'submit', 'give'];
  const hasSensitiveKeyword = checkMatches(sensitivePatterns);
  const hasAskContext = checkMatches(askWords);
  if (hasSensitiveKeyword && hasAskContext) {
    riskScore += 35;
    reasons.push("Unsolicited request to share or verify sensitive credentials (OTP, PIN, or Password).");
  } else if (hasSensitiveKeyword) {
    // Weak match (just mentions sensitive word without direct action word)
    riskScore += 15;
    reasons.push("Mentions banking credentials; banks never request these via text.");
  }

  // 2b. KYC / Aadhaar / PAN Verification Requests (Weight: 30)
  const kycPatterns = ['update kyc', 'pan link', 'aadhar link', 'aadhaar', 'pan card', 'kyc pending', 'verify kyc', 'account verification', 'freezing'];
  if (checkMatches(kycPatterns)) {
    riskScore += 30;
    reasons.push("Contains unsolicited request for KYC verification, PAN, or Aadhaar identity linking.");
  }

  // 3. Impersonation patterns (Weight: 20)
  const brandKeywords = ['idbi', 'rbi', 'bank manager', 'support team', 'verification desk'];
  if (checkMatches(brandKeywords) && (lowerMessage.includes('link') || lowerMessage.includes('http') || hasAskContext)) {
    riskScore += 20;
    reasons.push("Impersonates official entities (IDBI Bank, RBI) combined with a suspicious action request.");
  }

  // 4. Suspicious links (Weight: 30)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = analysisText.match(urlRegex) || [];
  
  // Lookalike checks & shortened link detection
  const shortenedDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly'];
  const maliciousTlds = ['.cc', '.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.work', '.top', '.info', '.live'];
  const ipAddressUrlRegex = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

  let hasLinkAlert = false;
  if (urls.length > 0) {
    let linkRisk = 0;
    
    // Check for shortening domains
    const isShortened = urls.some(url => {
      const urlLower = url.toLowerCase();
      return shortenedDomains.some(domain => urlLower.includes(domain));
    });

    // Check for lookalike domains (mentioning idbi but not official idbibank.in)
    const isLookalike = urls.some(url => {
      const urlLower = url.toLowerCase();
      return urlLower.includes('idbi') && !urlLower.includes('idbibank.in') && !urlLower.includes('idbibank.co.in');
    });

    // Check for raw IP address URL
    const isIpLink = urls.some(url => ipAddressUrlRegex.test(url));

    // Check for malicious TLDs
    const isMaliciousTld = urls.some(url => {
      const urlLower = url.toLowerCase();
      return maliciousTlds.some(tld => urlLower.endsWith(tld) || urlLower.includes(tld + '/'));
    });

    if (isLookalike) {
      linkRisk += 30;
      reasons.push("Contains a lookalike URL attempting to impersonate official banking portals.");
      hasLinkAlert = true;
    } else if (isIpLink) {
      linkRisk += 30;
      reasons.push("Contains a suspicious URL using a raw IP address instead of a domain name.");
      hasLinkAlert = true;
    } else if (isShortened) {
      linkRisk += 25;
      reasons.push("Contains a shortened link, which masks the final destination URL.");
      hasLinkAlert = true;
    } else if (isMaliciousTld) {
      linkRisk += 20;
      reasons.push("Contains a link pointing to a suspicious top-level domain (TLD) commonly used for phishing.");
      hasLinkAlert = true;
    } else {
      linkRisk += 15;
      reasons.push("Directs to external links outside official banking apps.");
      hasLinkAlert = true;
    }
    
    riskScore += linkRisk;
  }

  // 5. Prize/Lottery/Refund Language (Weight: 25)
  const prizeKeywords = ['lottery', 'won', 'crore', 'lakh', 'cashback', 'reward of', 'mega draw', 'refund pending', 'claim refund'];
  if (checkMatches(prizeKeywords)) {
    riskScore += 25;
    reasons.push("Uses lottery, prize awards, or pending refunds to entice replies.");
  }

  // 6. Formatting / Non-English / URL-only Edge Cases
  // Exclams & Caps:
  const capWords = analysisText.split(/\s+/).filter(word => word.length > 3 && word === word.toUpperCase() && /^[A-Z]+$/.test(word));
  const exclamationCount = (analysisText.match(/!/g) || []).length;
  if (capWords.length >= 3 || exclamationCount >= 3) {
    riskScore += 10;
    reasons.push("Uses excessive capitalization or exclamation marks, typical of pressure tactics.");
  }

  // Non-English / Unicode characters check:
  const isNonEnglish = /[^\x00-\x7F]/.test(analysisText);
  if (isNonEnglish) {
    reasons.push("Payload contains unicode/non-English characters. Language variance detected.");
  }

  // URL-only message:
  const isUrlOnly = urls.length > 0 && urls[0].trim() === analysisText.trim();
  if (isUrlOnly) {
    riskScore = Math.max(riskScore, 40); // URL-only SMS are highly suspicious by default
    reasons.push("Message contains only a URL with no context or descriptive text.");
  }

  // Determine Verdict and Confidence
  let verdict = 'safe';
  let explanation = 'This message appears to be safe and does not contain typical scam or phishing patterns.';

  // Verdict Thresholds: 
  // 0-30 = safe
  // 31-65 = suspicious
  // 66-100 = scam (bound to 100 max)
  const finalScore = Math.min(100, riskScore);

  if (finalScore >= 66) {
    verdict = 'scam';
    explanation = 'CRITICAL ALERT: This message exhibits high-risk signals matching severe scam categories. Do NOT click any links, call numbers listed, or reply.';
  } else if (finalScore >= 31) {
    verdict = 'suspicious';
    explanation = 'WARNING: This message contains moderate phishing indicators. Proceed with extreme caution and verify directly through official channels.';
  }

  // Deriving confidence mathematically
  let confidence = 95; // Default safe confidence
  if (verdict === 'scam') {
    confidence = Math.min(99, 60 + Math.round((finalScore - 66) * 1.15));
  } else if (verdict === 'suspicious') {
    confidence = Math.min(95, 50 + Math.round((finalScore - 31) * 1.25));
  } else {
    // If safe, confidence is higher if the risk score is closer to 0
    confidence = Math.max(80, 98 - Math.round(finalScore * 0.6));
  }

  return res.status(200).json({
    verdict,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['No threat signatures matched.'],
    explanation
  });
}

// OpenAI API Call Helper using gpt-4o-mini
async function classifyWithLLM(messageText, apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an advanced banking security analyzer. Evaluate the message for banking scam, spam, or phishing attempts. Respond ONLY with a valid JSON object matching this schema: {"verdict": "safe" | "suspicious" | "scam", "confidence": number (0-100), "reasons": string[], "explanation": string}. Do not add any backticks or extra text.'
          },
          {
            role: 'user',
            content: messageText
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    const parsed = JSON.parse(resultText);

    // Validate structure
    if (parsed.verdict && typeof parsed.confidence === 'number' && Array.isArray(parsed.reasons) && parsed.explanation) {
      return {
        verdict: parsed.verdict.toLowerCase(),
        confidence: Math.max(0, Math.min(100, parsed.confidence)),
        reasons: parsed.reasons,
        explanation: parsed.explanation
      };
    }
    return null;
  } catch (err) {
    console.error('Error in OpenAI call:', err);
    return null;
  }
}
