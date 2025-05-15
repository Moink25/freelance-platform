const axios = require("axios");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");

// Get chat suggestions from AI
const getChatSuggestions = async (chatId, messageText) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      // Fallback to local suggestions when OpenRouter API key isn't available
      return getLocalSuggestion(messageText);
    }

    // Get recent chat history for context (last 10 messages)
    const recentMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get chat details for context (project info, etc)
    const chatDetails = await Chat.findById(chatId).lean();

    // Format messages for the AI in reverse order (oldest first)
    const chatHistory = recentMessages.reverse().map((msg) => ({
      role: "user",
      content: msg.text,
    }));

    // Add current message to context
    chatHistory.push({
      role: "user",
      content: messageText,
    });

    // Call OpenRouter API
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "anthropic/claude-3-haiku", // Choose a suitable model
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant helping with chat suggestions in a freelancing platform. Keep your responses short, professional, and helpful. Avoid unnecessary details. Focus on helping the conversation move forward.",
          },
          ...chatHistory,
        ],
        max_tokens: 250,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
          "Content-Type": "application/json",
        },
      }
    );

    // Return the suggestion from AI
    if (
      response.data &&
      response.data.choices &&
      response.data.choices.length > 0
    ) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error("No suggestion generated from AI");
    }
  } catch (error) {
    console.error("AI suggestion error:", error.message);
    return getLocalSuggestion(messageText);
  }
};

// Fallback function to generate suggestions locally without API
const getLocalSuggestion = (messageText) => {
  // Common patterns in freelancing conversations
  const lowerText = messageText.toLowerCase();

  // Project proposals and discussions
  if (lowerText.includes("proposal") || lowerText.includes("project scope")) {
    return "I'd be happy to discuss this project in more detail. Could you share the specific requirements or timeline you have in mind?";
  }

  // Payment discussions
  if (
    lowerText.includes("payment") ||
    lowerText.includes("budget") ||
    lowerText.includes("price")
  ) {
    return "Thank you for discussing the budget. I assure you I'll deliver quality work within the agreed timeframe. Would you like to schedule a quick call to clarify expectations?";
  }

  // Timeline/deadline discussions
  if (
    lowerText.includes("deadline") ||
    lowerText.includes("timeline") ||
    lowerText.includes("when can you")
  ) {
    return "I can complete this project by [date]. Does that timeline work for your needs?";
  }

  // Portfolio/experience inquiries
  if (
    lowerText.includes("portfolio") ||
    lowerText.includes("experience") ||
    lowerText.includes("previous work")
  ) {
    return "I've worked on several similar projects before. Would you like me to share some relevant examples from my portfolio?";
  }

  // Contract discussions
  if (lowerText.includes("contract") || lowerText.includes("agreement")) {
    return "I'm comfortable with the terms we've discussed. Would you like to proceed with creating a formal contract through the platform?";
  }

  // Greeting or initial contact
  if (
    lowerText.includes("hello") ||
    lowerText.includes("hi") ||
    lowerText.length < 20
  ) {
    return "Thank you for reaching out! I'm interested in learning more about your project requirements. What type of work are you looking for?";
  }

  // Default fallback
  return "Thank you for the information. I'd be happy to discuss this further. What would be the next steps from your perspective?";
};

module.exports = {
  getChatSuggestions,
};
