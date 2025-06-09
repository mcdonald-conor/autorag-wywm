/**
 * Jaise - WYWM AI Assistant
 *
 * Handles the chat UI interactions and communication with the backend API.
 */

// DOM elements
const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

// Chat state
let chatHistory = [
  {
    role: "assistant",
    content: "Hello! I'm Jaise, your WYWM AI assistant. I'm here to help you with any questions about WYWM policies, programs, and services. Feel free to ask me about course information, enrollment processes, or any other WYWM-related topics!",
  },
];
let isProcessing = false;

// Auto-resize textarea as user types
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = Math.min(this.scrollHeight, 150) + "px"; // Cap height at 150px
});

// Send message on Enter (without Shift)
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Send button click handler
sendButton.addEventListener("click", sendMessage);

// Format message content with markdown-like syntax and extract source if present
function formatMessage(content) {
  // Extract source document if present
  let source = null;
  const sourceMatch = content.match(/\[([^\]]+\.(?:pdf|doc|docx))\]/);
  if (sourceMatch) {
    source = sourceMatch[1];
    content = content.replace(/\[([^\]]+\.(?:pdf|doc|docx))\]/, '').trim(); // Remove source from content and trim
  }

  // Format the main content
  let formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/\* (.*?)(?:\n|$)/g, '<li class="ml-4">$1</li>') // Convert * lists to bullet points
    .replace(/<li.*?>(.*?)<\/li>/g, '<ul class="list-disc space-y-1 my-2">$&</ul>'); // Wrap lists in ul

  // Add source pill if present
  if (source) {
    formattedContent += `
      <div class="mt-3 pt-3 border-t border-gray-100">
        <div class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors">
          <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          ${source}
        </div>
      </div>`;
  }

  return formattedContent;
}

/**
 * Creates a message element with consistent styling
 */
function createMessageElement(role, content) {
  const messageEl = document.createElement('div');
  messageEl.className = role === 'user'
    ? 'message user-message flex flex-row-reverse space-x-reverse space-x-4 items-start max-w-3xl ml-auto mb-6'
    : 'message assistant-message flex space-x-4 items-start max-w-3xl mb-6';

  const avatarEl = document.createElement('div');
  avatarEl.className = role === 'user'
    ? 'flex-shrink-0 w-8 h-8 rounded-lg bg-wywm-green-light dark:bg-wywm-green/20 flex items-center justify-center text-wywm-green font-semibold'
    : 'flex-shrink-0 w-8 h-8 rounded-lg bg-wywm-green flex items-center justify-center text-white font-semibold shadow-sm';
  avatarEl.textContent = role === 'assistant' ? 'J' : 'U';

  const contentEl = document.createElement('div');
  contentEl.className = role === 'user'
    ? 'flex-1 bg-wywm-green-light dark:bg-gray-700/50 rounded-2xl p-4 sm:p-5 text-gray-800 dark:text-gray-100 leading-relaxed message-content'
    : 'flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 text-gray-800 dark:text-gray-100 leading-relaxed message-content';

  contentEl.innerHTML = formatMessage(content);

  if (role === 'user') {
    messageEl.appendChild(contentEl);
    messageEl.appendChild(avatarEl);
  } else {
    messageEl.appendChild(avatarEl);
    messageEl.appendChild(contentEl);
  }

  return messageEl;
}

/**
 * Creates and shows the typing indicator
 */
function showTypingIndicator() {
  // Remove any existing typing indicator
  hideTypingIndicator();

  const indicatorEl = document.createElement('div');
  indicatorEl.id = 'typing-indicator';
  indicatorEl.className = 'message assistant-message flex space-x-4 items-start max-w-3xl mb-6';

  const avatarEl = document.createElement('div');
  avatarEl.className = 'flex-shrink-0 w-8 h-8 rounded-lg bg-wywm-green flex items-center justify-center text-white font-semibold shadow-sm';
  avatarEl.textContent = 'J';

  const contentEl = document.createElement('div');
  contentEl.className = 'flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 sm:p-5 text-gray-600 dark:text-gray-400';
  contentEl.innerHTML = 'Jaise is thinking...';

  indicatorEl.appendChild(avatarEl);
  indicatorEl.appendChild(contentEl);

  chatMessages.appendChild(indicatorEl);

  // Scroll to bottom
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

/**
 * Removes the typing indicator
 */
function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Sends a message to the chat API and processes the response
 */
async function sendMessage() {
  const message = userInput.value.trim();

  // Don't send empty messages
  if (message === "" || isProcessing) return;

  // Disable input while processing
  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  // Add user message to chat
  const userMessageEl = createMessageElement("user", message);
  chatMessages.appendChild(userMessageEl);

  // Clear input
  userInput.value = "";
  userInput.style.height = "auto";

  // Show typing indicator
  showTypingIndicator();

  // Add message to history
  chatHistory.push({ role: "user", content: message });

  try {
    // Send request to API
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: chatHistory,
      }),
    });

    // Handle errors
    if (!response.ok) {
      throw new Error("Failed to get response");
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let responseText = "";
    let assistantMessageEl = null;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // Decode chunk
      const chunk = decoder.decode(value, { stream: true });

      // Process SSE format
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const jsonData = JSON.parse(line.substring(5));
            if (jsonData.response) {
              // Create assistant message element if it doesn't exist
              if (!assistantMessageEl) {
                hideTypingIndicator();
                assistantMessageEl = createMessageElement("assistant", "");
                chatMessages.appendChild(assistantMessageEl);
              }

              // Append new content to existing text
              responseText += jsonData.response;
              const contentEl = assistantMessageEl.querySelector(".message-content");
              contentEl.innerHTML = formatMessage(responseText);

              // Smooth scroll to bottom
              chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: 'smooth'
              });
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }
    }

    // Add completed response to chat history
    chatHistory.push({ role: "assistant", content: responseText });
  } catch (error) {
    console.error("Error:", error);
    hideTypingIndicator();
    const errorMessageEl = createMessageElement(
      "assistant",
      "I apologize, but I encountered an error processing your request. Please try again."
    );
    chatMessages.appendChild(errorMessageEl);
  } finally {
    // Hide typing indicator if still showing
    hideTypingIndicator();

    // Re-enable input
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}
