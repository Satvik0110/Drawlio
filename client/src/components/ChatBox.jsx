
export default function ChatBox({ messages, input, setInput, onSend, disableSubmit }) {
  return (
    <div style={{ position: 'fixed', right: 10, top: 10, width: 300, background: '#eee', padding: 10, zIndex: 20 }}>
      <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ color: m.correct ? 'green' : 'black' }}>
            <b>{m.name}:</b> {m.msg}
          </div>
        ))}
      </div>
      <form onSubmit={onSend}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your guess..."
          style={{ width: '80%' }}
          disabled={disableSubmit} 
        />
    <button type="submit" disabled={disableSubmit}>Send</button>
      </form>
    </div>
  );
}