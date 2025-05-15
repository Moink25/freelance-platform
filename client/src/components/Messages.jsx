import noImage from "../assets/Images/no-image.png";
import { useEffect, useRef, useState } from "react";
import "../components/Chat.css";
import {
  conversationMessages,
  setNewMessages,
  getChatSuggestion,
  clearSuggestion,
} from "../Redux/ChatSlice";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import { sendMessage } from "../Redux/ChatSlice";
import io from "socket.io-client";

export default function Message({ selectedMessage }) {
  const message = useRef();
  const chat = useRef();
  const { id } = useParams();
  const { messages, suggestion, isLoadingSuggestion, suggestionError } =
    useSelector((state) => state.chat);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const socket = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [userTyping, setUserTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    dispatch(conversationMessages(selectedMessage))
      .unwrap()
      .then((data) => {
        if (data.status === 200) {
          const newMessage = chat.current.lastElementChild;
          if (newMessage) {
            newMessage.scrollIntoView({ behavior: "smooth" });
          }
        }
        if (data.status === 404) {
          toast.error(data.msg);
          navigate("/login");
        }
        if (data.status === 505) {
          toast.error(data.msg);
        }
      })
      .catch((rejectedValueOrSerializedError) => {
        toast.error(rejectedValueOrSerializedError);
      });
  }, [selectedMessage]);

  useEffect(() => {
    socket.current = io("ws://localhost:8900");
    socket.current.on("getMessage", (data) => {
      setArrivalMessage({
        senderId: data.senderId,
        text: data.text,
        createdAt: Date.now(),
        chatId: data.chatId,
      });
    });
  }, []);

  useEffect(() => {
    arrivalMessage &&
      arrivalMessage.chatId === selectedMessage &&
      dispatch(setNewMessages(arrivalMessage));
  }, [arrivalMessage]);

  useEffect(() => {
    socket.current.emit("addUser", id);
  }, [id]);

  useEffect(() => {
    if (chat.current) {
      const newMessage = chat.current.lastElementChild;
      if (newMessage) {
        newMessage.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [messages]);

  // New effect to suggest messages based on conversation context
  useEffect(() => {
    // Only trigger suggestions when messages are loaded and there's at least one message
    if (messages?.messages?.conversationMessages?.length > 0) {
      // Get the last message that wasn't sent by the current user
      const lastOtherUserMessage = [...messages.messages.conversationMessages]
        .reverse()
        .find((msg) => msg.senderId !== id);

      if (lastOtherUserMessage) {
        // Generate quick suggestions locally
        const quickSuggestions = generateQuickSuggestions(
          lastOtherUserMessage.text
        );
        setSuggestions(quickSuggestions);

        // Also keep the AI suggestion flow for more complex suggestions
        dispatch(
          getChatSuggestion({
            chatId: selectedMessage,
            messageText: lastOtherUserMessage.text,
          })
        );
      }
    }
  }, [selectedMessage, messages?.messages?.conversationMessages]);

  // Generate 3 quick suggested responses based on the last message
  const generateQuickSuggestions = (lastMessage) => {
    const text = lastMessage.toLowerCase();
    const suggestions = [];

    // Project inquiries
    if (
      text.includes("project") ||
      text.includes("work") ||
      text.includes("job")
    ) {
      suggestions.push("I'm interested in your project");
      suggestions.push("Could you share more details?");
      suggestions.push("What's your timeline for this?");
    }

    // Payment or budget discussions
    else if (
      text.includes("payment") ||
      text.includes("budget") ||
      text.includes("cost")
    ) {
      suggestions.push("The budget works for me");
      suggestions.push("Could we discuss the payment terms?");
      suggestions.push("I'll send you a detailed proposal");
    }

    // Timeline questions
    else if (
      text.includes("when") ||
      text.includes("timeline") ||
      text.includes("deadline")
    ) {
      suggestions.push("I can deliver by next week");
      suggestions.push("Let me check my availability");
      suggestions.push("This timeline works for me");
    }

    // Portfolio inquiries
    else if (
      text.includes("portfolio") ||
      text.includes("experience") ||
      text.includes("previous")
    ) {
      suggestions.push("I'll share some examples");
      suggestions.push("I've worked on similar projects");
      suggestions.push("Check my portfolio link");
    }

    // Questions
    else if (text.includes("?")) {
      suggestions.push("Yes, that works for me");
      suggestions.push("I need to think about this");
      suggestions.push("Could you clarify that?");
    }

    // Greetings or short messages
    else if (
      text.length < 20 ||
      text.includes("hello") ||
      text.includes("hi")
    ) {
      suggestions.push("Hello! How can I help?");
      suggestions.push("Great to connect with you");
      suggestions.push("I'm interested in working with you");
    }

    // Default suggestions
    else {
      suggestions.push("Thanks for the information");
      suggestions.push("I understand");
      suggestions.push("Let's discuss this further");
    }

    return suggestions;
  };

  const sendMessageAndDisplay = () => {
    if (message.current.value.trim() !== "") {
      const text = message.current.value.trim();
      socket.current.emit("sendMessage", {
        senderId: id,
        receiverId: messages.messages.withInfo._id,
        text,
        chatId: selectedMessage,
      });
      dispatch(sendMessage({ receiver: messages.messages.withInfo._id, text }))
        .unwrap()
        .then((data) => {
          if (data.status === 200) {
            dispatch(conversationMessages(selectedMessage))
              .unwrap()
              .then((data) => {
                if (data.status === 200) {
                  message.current.value = "";
                  dispatch(clearSuggestion());
                  setUserTyping(false);
                  const newMessage = chat.current.lastElementChild;
                  if (newMessage) {
                    newMessage.scrollIntoView({ behavior: "smooth" });
                  }
                }
                if (data.status === 404) {
                  toast.error(data.msg);
                  navigate("/login");
                }
                if (data.status === 505) {
                  toast.error(data.msg);
                }
              })
              .catch((rejectedValueOrSerializedError) => {
                toast.error(rejectedValueOrSerializedError);
              });
          }
          if (data.status === 404) {
            toast.error(data.msg);
            navigate("/login");
          }
          if (data.status === 505) {
            toast.error(data.msg);
          }
        })
        .catch((rejectedValueOrSerializedError) => {
          toast.error(rejectedValueOrSerializedError);
        });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessageAndDisplay();
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setUserTyping(text.length > 0);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // If input is empty, clear AI suggestions but keep quick suggestions visible
    if (!text.trim()) {
      dispatch(clearSuggestion());
      // Make sure quick suggestions are visible when text field is empty
      if (messages?.messages?.conversationMessages?.length > 0) {
        const lastOtherUserMessage = [...messages.messages.conversationMessages]
          .reverse()
          .find((msg) => msg.senderId !== id);

        if (lastOtherUserMessage) {
          const quickSuggestions = generateQuickSuggestions(
            lastOtherUserMessage.text
          );
          setSuggestions(quickSuggestions);
        }
      }
      return;
    }
    // Don't hide suggestions when typing - keep them visible
    // setSuggestions([]); - removing this line

    // Get AI suggestions after a short delay of typing pause
    const newTimeout = setTimeout(() => {
      if (text.trim() && text.trim().length >= 2) {
        dispatch(
          getChatSuggestion({
            chatId: selectedMessage,
            messageText: text.trim(),
          })
        );
      }
    }, 500); // Reduced from 1000ms to 500ms

    setTypingTimeout(newTimeout);
  };

  const applySuggestion = (text) => {
    message.current.value = text;
    // Focus the input field instead of immediately sending
    message.current.focus();
    // Clear the suggestions
    setSuggestions([]);
  };

  return (
    <div className="selectedMessage">
      {messages?.messages?.withInfo && (
        <>
          <div className="selectedMessageHeader">
            <img
              src={
                messages?.messages?.withInfo?.avatar === "no-image.png"
                  ? noImage
                  : `http://localhost:3001/ProfilePic/${messages?.messages?.withInfo?.avatar}`
              }
              alt={`${messages?.messages?.withInfo?.username} avatar`}
            />
            <span>{messages?.messages?.withInfo?.username}</span>
          </div>
          <div className="messageDate">
            {moment(messages?.messages?.chatTime).format("LLL")}
          </div>
          <div className="chatM" ref={chat}>
            {messages?.messages?.conversationMessages.map((message, i) => (
              <div
                key={i}
                className={
                  message.senderId === id ? "myMessage" : "usersMessage"
                }
              >
                <div
                  className={
                    message.senderId === id
                      ? "myMessageBody"
                      : "usersMessageBody"
                  }
                >
                  {message.text}
                </div>
                <span>{moment(message.createdAt).format("LT")}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <hr />

      {/* Quick Reply Suggestions (Gmail style) */}
      {suggestions.length > 0 && (
        <div className="quickSuggestionsContainer">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="quickSuggestionButton"
              onClick={() => applySuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* AI Suggestion Display - Keep but make it appear only when specifically requested */}
      {suggestion && userTyping && (
        <div className="aiSuggestionBox">
          <div className="aiSuggestionHeader">
            <span>✨ AI Suggestion</span>
            <button onClick={() => applySuggestion(suggestion)}>
              Use this
            </button>
          </div>
          <div className="aiSuggestionContent">{suggestion}</div>
        </div>
      )}

      {isLoadingSuggestion && (
        <div className="aiSuggestionBox loading">
          <div className="aiSuggestionHeader">
            <span>AI is thinking...</span>
            <div className="suggestionLoader">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        </div>
      )}

      {suggestionError && (
        <div className="aiSuggestionBox error">
          <div className="aiSuggestionHeader">
            <span>AI Error: {suggestionError}</span>
            <button onClick={() => dispatch(clearSuggestion())}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="sendBox">
        <div className="inputbox">
          <div className="svg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="25"
              height="25"
              viewBox="0 0 25 25"
            >
              <path
                id="paper-clip"
                d="M20.665,13.2a3.9,3.9,0,0,0-5.025,0L5.18,22.435a4.968,4.968,0,0,0,0,7.646,6.715,6.715,0,0,0,8.664,0l8.641-7.626a1.75,1.75,0,0,1,2.251,0,1.294,1.294,0,0,1,0,1.987l-8.641,7.626a10.2,10.2,0,0,1-13.166,0,7.549,7.549,0,0,1,0-11.619l10.46-9.231a7.384,7.384,0,0,1,9.528,0,5.464,5.464,0,0,1,0,8.408l-10.005,8.83a4.567,4.567,0,0,1-5.889,0,3.379,3.379,0,0,1,0-5.2l8.186-7.224a1.75,1.75,0,0,1,2.251,0,1.294,1.294,0,0,1,0,1.987L9.273,25.244a.8.8,0,0,0,0,1.224,1.08,1.08,0,0,0,1.387,0l10.005-8.83a2.883,2.883,0,0,0,0-4.435Z"
                transform="translate(-0.2 -9.475)"
                fill="rgba(112,112,112,0.5)"
              />
            </svg>
          </div>
          <textarea
            ref={message}
            name="sendMessage"
            id="sendMessage"
            placeholder="Write your message here..."
            onKeyPress={handleKeyPress}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <button onClick={sendMessageAndDisplay}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
          >
            <path
              id="paper-plane-regular"
              d="M1.093,12.7a1.574,1.574,0,0,0,.176,2.8l6.855,2.856V23.4a1.6,1.6,0,0,0,2.824,1.021l3.029-3.628,6.054,2.52a1.577,1.577,0,0,0,2.145-1.206L25.3,1.793A1.563,1.563,0,0,0,22.983.2L1.093,12.7Zm2.546,1.245L20.325,4.42,9.6,16.4l.059.049Zm16.373,6.821-8.14-3.394L22.333,5.69Z"
              transform="translate(-0.322 0.004)"
              fill="#fbfbfb"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
