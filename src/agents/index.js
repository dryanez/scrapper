// Mock Agent SDK for local development without Base44

// Helper to generate unique IDs
const generateId = () => `conv_${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Store conversations in memory
const conversations = new Map();

// Agent SDK wrapper for interacting with agents (mock implementation)
export const agentSDK = {
  // Create a new conversation with an agent
  createConversation: async ({ agent_name, metadata }) => {
    const conversation = {
      id: generateId(),
      agent_name,
      metadata,
      messages: [],
      created_at: new Date().toISOString()
    };
    conversations.set(conversation.id, conversation);
    console.log('Created mock conversation:', conversation.id);
    return conversation;
  },

  // Subscribe to conversation updates
  subscribeToConversation: (conversationId, callback) => {
    console.log('Subscribing to conversation:', conversationId);
    
    // Return the current state immediately
    const conversation = conversations.get(conversationId);
    if (conversation) {
      setTimeout(() => callback(conversation), 100);
    }

    // Return unsubscribe function
    return () => {
      console.log('Unsubscribed from conversation:', conversationId);
    };
  },

  // Add a message to a conversation
  addMessage: async (conversation, message) => {
    const conv = conversations.get(conversation.id);
    if (!conv) {
      throw new Error(`Conversation ${conversation.id} not found`);
    }

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}`,
      ...message,
      status: 'completed',
      created_at: new Date().toISOString()
    };
    conv.messages.push(userMessage);

    // Simulate assistant response after a delay
    setTimeout(() => {
      const assistantMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `**Mock Agent Response**\n\nThis is a simulated response from the "${conv.agent_name}" agent.\n\nIn a production environment, this would connect to an actual AI agent service.\n\nYour message was: "${message.content}"`,
        status: 'completed',
        created_at: new Date().toISOString()
      };
      conv.messages.push(assistantMessage);
    }, 1000);

    return userMessage;
  }
};

export default agentSDK;
