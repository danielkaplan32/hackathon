import React from 'react';


const TradeModal = ({ onClose }) => {
  return (
    <div className="modal-overlay open" id="trade-modal" role="dialog" aria-modal="true" aria-labelledby="trade-modal-title" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh'}}>
      <div className="modal" style={{ position: 'relative', margin: '0 auto' }}>
        <button className="close-modal" onClick={onClose} aria-label="Close Trade Modal">✕</button>
        <div className="modal-title" id="trade-modal-title">Propose a Trade</div>
        <div className="modal-sub">Choose one of your items to offer in exchange.</div>
        <div className="trade-preview" aria-label="Trade Preview">
          <div className="trade-preview-item">
            <div className="trade-preview-emoji" id="tm-their-emoji">📱</div>
            <div className="trade-preview-name" id="tm-their-name">Their Item</div>
            <div className="trade-preview-owner" id="tm-their-owner">by @someone</div>
          </div>
          <div className="trade-arrow" aria-hidden="true">⇄</div>
          <div className="trade-preview-item">
            <div className="trade-preview-emoji" id="tm-my-emoji">❓</div>
            <div className="trade-preview-name">Your Offer</div>
            <div className="trade-preview-owner" id="tm-my-owner">by you</div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="tm-offer-select">Offer one of your items</label>
          <select id="tm-offer-select" aria-label="Offer one of your items"></select>
        </div>
        <div className="form-group">
          <label htmlFor="tm-message">Message (optional)</label>
          <textarea id="tm-message" placeholder={"Hey! I'd love to trade for your…"} style={{ minHeight: 70 }} aria-label="Trade message"></textarea>
        </div>
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={onClose} aria-label="Cancel">Cancel</button>
          <button className="btn btn--primary" aria-label="Send Trade Request">Send Request</button>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;
