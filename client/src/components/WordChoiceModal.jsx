export default function WordChoiceModal({ words, onChoose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3>Choose a word:</h3>
        {words.map((word, idx) => (
          <button
            key={idx}
            style={{ margin: '10px', padding: '10px 20px', fontSize: '16px' }}
            onClick={() => onChoose(word)}
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
