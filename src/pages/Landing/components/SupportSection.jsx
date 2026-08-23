import React from "react";

/**
 * SupportSection Component ("Support")
 * 
 * Multi-channel customer assistance, 24/7 fraud helpline, and instant help desk:
 * 1. 24/7 Live Support
 * 2. Fraud & Security Helpdesk
 * 3. Knowledge Base & FAQs
 */
export function SupportSection({ onNavigate }) {
  const supportChannels = [
    {
      id: "live-chat",
      title: "24/7 Banking Concierge",
      description: "Connect with certified banking specialists anytime for transfers, statements, or general assistance.",
      actionLabel: "Start Chat Support",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      )
    },
    {
      id: "fraud-desk",
      title: "Fraud & Security Desk",
      description: "Dedicated rapid-response unit for instant card blocking, unauthorized transaction alerts, and dispute resolution.",
      actionLabel: "Emergency Support",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )
    },
    {
      id: "help-center",
      title: "Help Center & FAQs",
      description: "Comprehensive repository of step-by-step guides, API references, interest rate schedules, and security tips.",
      actionLabel: "Browse Help Articles",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  ];

  return (
    <section className="support-section" id="support">
      <div className="support-section__container">
        
        {/* Header */}
        <div className="section-header">
          <span className="section-header__eyebrow">SUPPORT & HELP DESK</span>
          <h2 className="section-header__title">
            We&apos;re Here to Help You, Anytime
          </h2>
          <p className="section-header__description">
            Experience exceptional customer care with round-the-clock priority support and immediate dispute resolution.
          </p>
        </div>

        {/* 3 Support Channel Cards */}
        <div className="support-cards-grid">
          {supportChannels.map((channel) => (
            <div key={channel.id} className="support-channel-card">
              <div className="support-channel-card__icon-box">
                {channel.icon}
              </div>
              <h3 className="support-channel-card__title">{channel.title}</h3>
              <p className="support-channel-card__desc">{channel.description}</p>
              
              <div 
                className="support-channel-card__btn"
                role="presentation"
                aria-hidden="true"
              >
                <span>{channel.actionLabel}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" className="support-channel-card__arrow">
                  <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default SupportSection;
