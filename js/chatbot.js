// Chatbot configuration
const chatbotConfig = {
    name: "NTC Assistant",
    welcomeMessage: "Hello! I'm your NTC Assistant. How can I help you today?",
    quickReplies: [
        "Currency Exchange Rates",
        "How to Exchange Currency",
        "Contact Support",
        "Account Help"
    ],
    responses: {
        "Currency Exchange Rates": "You can check our live exchange rates in the 'Live Exchange Rates' section. The rates are updated in real-time and show the latest market values.",
        "How to Exchange Currency": "To exchange currency, you can visit any of our branches or use our online platform. You'll need a valid ID and the currency you wish to exchange.",
        "Contact Support": "You can reach our support team at support@ntc.com or call us at +1 234 567 8900. Our support is available 24/7.",
        "Account Help": "For account-related assistance, please visit our 'Help Center' or contact our customer support team directly."
    }
};

// DOM Elements
const chatButton = document.getElementById('chatButton');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');
const closeChat = document.getElementById('closeChat');

// Chat state
let isChatOpen = false;
let isTyping = false;

// Initialize chatbot
function initChatbot() {
    // Add welcome message
    addMessage(chatbotConfig.welcomeMessage, 'bot');
    
    // Add quick replies
    addQuickReplies(chatbotConfig.quickReplies);
}

// Toggle chat window
function toggleChat() {
    isChatOpen = !isChatOpen;
    chatWindow.style.display = isChatOpen ? 'flex' : 'none';
    chatButton.style.transform = isChatOpen ? 'rotate(45deg)' : 'rotate(0)';
    
    if (isChatOpen) {
        chatInput.focus();
    }
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = `<p>${text}</p>`;
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add quick replies
function addQuickReplies(replies) {
    const quickRepliesDiv = document.createElement('div');
    quickRepliesDiv.className = 'quick-replies';
    
    replies.forEach(reply => {
        const button = document.createElement('button');
        button.className = 'quick-reply';
        button.textContent = reply;
        button.onclick = () => handleQuickReply(reply);
        quickRepliesDiv.appendChild(button);
    });
    
    chatMessages.appendChild(quickRepliesDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    if (isTyping) return;
    
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return typingDiv;
}

// Hide typing indicator
function hideTypingIndicator(typingDiv) {
    if (typingDiv) {
        typingDiv.remove();
    }
    isTyping = false;
}

// Handle quick reply
function handleQuickReply(reply) {
    // Remove quick replies
    const quickReplies = document.querySelector('.quick-replies');
    if (quickReplies) {
        quickReplies.remove();
    }
    
    // Add user message
    addMessage(reply, 'user');
    
    // Show typing indicator
    const typingDiv = showTypingIndicator();
    
    // Simulate bot response delay
    setTimeout(() => {
        hideTypingIndicator(typingDiv);
        
        // Add bot response
        if (chatbotConfig.responses[reply]) {
            addMessage(chatbotConfig.responses[reply], 'bot');
        } else {
            addMessage("I'm sorry, I don't have a specific response for that. Please try one of the quick replies or ask a different question.", 'bot');
        }
        
        // Add new quick replies
        addQuickReplies(chatbotConfig.quickReplies);
    }, 1000);
}

// Handle user message
function handleUserMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';
    
    // Show typing indicator
    const typingDiv = showTypingIndicator();
    
    // Simulate bot response delay
    setTimeout(() => {
        hideTypingIndicator(typingDiv);
        
        // Simple response logic
        let response = "I'm sorry, I don't understand. Please try using one of the quick replies or rephrase your question.";
        
        // Check if message contains keywords
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('rate') || lowerMessage.includes('exchange')) {
            response = chatbotConfig.responses['Currency Exchange Rates'];
        } else if (lowerMessage.includes('how') && lowerMessage.includes('exchange')) {
            response = chatbotConfig.responses['How to Exchange Currency'];
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('support')) {
            response = chatbotConfig.responses['Contact Support'];
        } else if (lowerMessage.includes('account')) {
            response = chatbotConfig.responses['Account Help'];
        }
        
        // Add bot response
        addMessage(response, 'bot');
        
        // Add quick replies
        addQuickReplies(chatbotConfig.quickReplies);
    }, 1000);
}

// Event Listeners
chatButton.addEventListener('click', toggleChat);
closeChat.addEventListener('click', toggleChat);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleUserMessage();
    }
});

sendMessage.addEventListener('click', handleUserMessage);

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', initChatbot);

let faqData = [];

// Load the FAQ data from the JSON file
fetch('faq_data.json')
  .then(response => response.json())
  .then(data => {
    faqData = data;
  });

// Function to find the best answer
function findAnswer(userQuestion) {
  // Simple match: you can improve with fuzzy search or AI later
  const lowerQ = userQuestion.toLowerCase();
  for (const item of faqData) {
    if (lowerQ.includes(item.question.toLowerCase().split(' ')[0])) {
      return item.answer;
    }
  }
  return "Sorry, I don't know the answer to that yet.";
}

// Example: Hook into your chatbot send button
document.getElementById('sendMessage').addEventListener('click', function() {
  const userInput = document.getElementById('chatInput').value;
  const answer = findAnswer(userInput);
  // Display answer in chat window
  // (Add your own code to append the answer to the chat)
  alert(answer); // Replace with your chat display logic
}); 