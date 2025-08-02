export default function ChatBox({ messages, input, setInput, onSend, disableSubmit }) {
  return (
    <div className="fixed bottom-4 right-2 sm:right-4 w-72 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
      <div className="bg-gray-50 px-3 sm:px-4 py-2 rounded-t-lg border-b border-gray-200">
        <h3 className="text-xs sm:text-sm font-medium text-gray-700">Chat</h3>
      </div>
      <div className="h-32 sm:h-48 overflow-y-auto p-2 sm:p-3 space-y-1 sm:space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs sm:text-sm ${m.correct ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
            <span className="font-medium">{m.name}:</span> {m.msg}
          </div>
        ))}
      </div>
      <div className="p-2 sm:p-3 border-t border-gray-200">
        <div className="flex space-x-1 sm:space-x-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your guess..."
            disabled={disableSubmit}
            className="flex-1 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            onKeyDown={e => e.key === 'Enter' && !disableSubmit && input.trim() && onSend(e)}
          />
          <button 
            type="button"
            onClick={onSend}
            disabled={disableSubmit || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-2 sm:px-4 py-1 sm:py-2 rounded text-xs sm:text-sm transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}