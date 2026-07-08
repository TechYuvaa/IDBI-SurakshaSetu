import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

let llmCallCount = 0;

export const checkMessage = async (req: Request, res: Response, next: NextFunction) => {
  const { message } = req.body;

  if (message === undefined || message === null) {
    return res.status(400).json({ error: 'Message payload is required.', code: 'INVALID_INPUT' });
  }

  if (typeof message !== 'string') {
    return res.status(400).json({ error: 'Message payload must be a string.', code: 'INVALID_INPUT' });
  }

  const trimmedMessage = message.trim();

  // Empty string checks
  if (trimmedMessage.length === 0) {
    return res.status(200).json({
      verdict: 'safe',
      confidence: 95,
      reasons: ['Payload contains no text content.'],
      explanation: 'This input is empty and poses no security threat.'
    });
  }

  // Length boundaries check
  if (trimmedMessage.length >= 5000) {
    return res.status(400).json({ error: 'Payload exceeds maximum safety length of 5000 characters.', code: 'LIMIT_EXCEEDED' });
  }

  const analysisText = trimmedMessage.slice(0, 2000);
  const lowerMessage = analysisText.toLowerCase();

  // Check OpenAI completions
  const openAiApiKey = process.env.OPENAI_API_KEY;
  if (openAiApiKey && llmCallCount < 20) {
    try {
      llmCallCount++;
      const llmResult = await classifyWithLLM(analysisText, openAiApiKey);
      if (llmResult) {
        return res.status(200).json(llmResult);
      }
    } catch (err: any) {
      logger.warn(`OpenAI verification failed: ${err.message}. Falling back to local heuristics.`);
    }
  }

  // --- LOCAL HEURISTICS ENGINE ---
  let riskScore = 0;
  const reasons = [];

  const checkMatches = (patterns: string[]) => {
    return patterns.some(pattern => lowerMessage.includes(pattern));
  };

  // 1. Urgency / Threat Language (Weight: 25)
  const urgencyPatterns = ['act now', 'account will be blocked', 'immediately', 'within 24 hours', 'action required', 'expires today', 'immediate suspension', 'freeze'];
  if (checkMatches(urgencyPatterns)) {
    riskScore += 25;
    reasons.push("Creates a false sense of high urgency or threat of account suspension.");
  }

  // 2. Sensitive Credentials Requests (Weight: 35)
  const sensitivePatterns = ['otp', 'one time password', 'pin', 'cvv', 'card number', 'expiry date', 'password', 'netbanking password', 'login credential'];
  const askWords = ['share', 'send', 'verify', 'provide', 'enter', 'submit', 'give'];
  const hasSensitiveKeyword = checkMatches(sensitivePatterns);
  const hasAskContext = checkMatches(askWords);
  if (hasSensitiveKeyword && hasAskContext) {
    riskScore += 35;
    reasons.push("Unsolicited request to share or verify sensitive credentials (OTP, PIN, or Password).");
  } else if (hasSensitiveKeyword) {
    riskScore += 15;
    reasons.push("Mentions banking credentials; banks never request these via text.");
  }

  // 2b. KYC / Aadhaar / PAN Verification Requests (Weight: 30)
  const kycPatterns = ['update kyc', 'pan link', 'aadhar link', 'aadhaar', 'pan card', 'kyc pending', 'verify kyc', 'account verification', 'freezing'];
  if (checkMatches(kycPatterns)) {
    riskScore += 30;
    reasons.push("Contains unsolicited request for KYC verification, PAN, or Aadhaar identity linking.");
  }

  // 3. Brand Impersonation (Weight: 20)
  const brandKeywords = ['idbi', 'rbi', 'bank manager', 'support team', 'verification desk'];
  if (checkMatches(brandKeywords) && (lowerMessage.includes('link') || lowerMessage.includes('http') || hasAskContext)) {
    riskScore += 20;
    reasons.push("Impersonates official entities (IDBI Bank, RBI) combined with a suspicious action request.");
  }

  // 4. Link Vetting (Weight: 30)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = analysisText.match(urlRegex) || [];
  const shortenedDomains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly'];
  const maliciousTlds = ['.cc', '.xyz', '.tk', '.ml', '.ga', '.cf', '.gq', '.work', '.top', '.info', '.live'];
  const ipAddressUrlRegex = /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

  if (urls.length > 0) {
    let linkRisk = 0;
    const isShortened = urls.some(url => shortenedDomains.some(domain => url.toLowerCase().includes(domain)));
    const isLookalike = urls.some(url => {
      const urlLower = url.toLowerCase();
      return urlLower.includes('idbi') && !urlLower.includes('idbibank.in') && !urlLower.includes('idbibank.co.in');
    });
    const isIpLink = urls.some(url => ipAddressUrlRegex.test(url));
    const isMaliciousTld = urls.some(url => maliciousTlds.some(tld => url.toLowerCase().endsWith(tld) || url.toLowerCase().includes(tld + '/')));

    if (isLookalike) {
      linkRisk += 30;
      reasons.push("Contains a lookalike URL attempting to impersonate official banking portals.");
    } else if (isIpLink) {
      linkRisk += 30;
      reasons.push("Contains a suspicious URL using a raw IP address instead of a domain name.");
    } else if (isShortened) {
      linkRisk += 25;
      reasons.push("Contains a shortened link, which masks the final destination URL.");
    } else if (isMaliciousTld) {
      linkRisk += 20;
      reasons.push("Contains a link pointing to a suspicious top-level domain (TLD) commonly used for phishing.");
    } else {
      linkRisk += 15;
      reasons.push("Directs to external links outside official banking apps.");
    }
    riskScore += linkRisk;
  }

  // 5. Reward / Refund Claims (Weight: 25)
  const prizeKeywords = ['lottery', 'won', 'crore', 'lakh', 'cashback', 'reward of', 'mega draw', 'refund pending', 'claim refund'];
  if (checkMatches(prizeKeywords)) {
    riskScore += 25;
    reasons.push("Uses lottery, prize awards, or pending refunds to entice replies.");
  }

  // 6. Formatting & Unicode checks
  const capWords = analysisText.split(/\s+/).filter(word => word.length > 3 && word === word.toUpperCase() && /^[A-Z]+$/.test(word));
  const exclamationCount = (analysisText.match(/!/g) || []).length;
  if (capWords.length >= 3 || exclamationCount >= 3) {
    riskScore += 10;
    reasons.push("Uses excessive capitalization or exclamation marks, typical of pressure tactics.");
  }

  const isNonEnglish = /[^\x00-\x7F]/.test(analysisText);
  if (isNonEnglish) {
    reasons.push("Payload contains unicode/non-English characters. Language variance detected.");
  }

  const isUrlOnly = urls.length > 0 && urls[0]?.trim() === analysisText.trim();
  if (isUrlOnly) {
    riskScore = Math.max(riskScore, 40);
    reasons.push("Message contains only a URL with no context or descriptive text.");
  }

  // Determine thresholds
  const finalScore = Math.min(100, riskScore);
  let verdict = 'safe';
  let explanation = 'This message appears to be safe and does not contain typical scam or phishing patterns.';

  if (finalScore >= 66) {
    verdict = 'scam';
    explanation = 'CRITICAL ALERT: This message exhibits high-risk signals matching severe scam categories. Do NOT click any links, call numbers listed, or reply.';
  } else if (finalScore >= 31) {
    verdict = 'suspicious';
    explanation = 'WARNING: This message contains moderate phishing indicators. Proceed with extreme caution and verify directly through official channels.';
  }

  let confidence = 95;
  if (verdict === 'scam') {
    confidence = Math.min(99, 60 + Math.round((finalScore - 66) * 1.15));
  } else if (verdict === 'suspicious') {
    confidence = Math.min(95, 50 + Math.round((finalScore - 31) * 1.25));
  } else {
    confidence = Math.max(80, 98 - Math.round(finalScore * 0.6));
  }

  return res.status(200).json({
    verdict,
    confidence,
    reasons: reasons.length > 0 ? reasons : ['No threat signatures matched.'],
    explanation
  });
};

async function classifyWithLLM(messageText: string, apiKey: string) {
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

    const data: any = await response.json();
    const resultText = data.choices[0].message.content;
    const parsed = JSON.parse(resultText);

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
    logger.error('Error in OpenAI API call:', err);
    return null;
  }
}
