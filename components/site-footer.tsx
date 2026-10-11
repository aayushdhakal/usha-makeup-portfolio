export default function SiteFooter({ currentPage = "home" }: { currentPage?: "home" | "booking" | "academy" }) {
  return (
      <footer className="contact-section" id="contact">
        <div className="contact-brand">
          <a href="/#home" aria-label="Usha Makeup and Nails home"><img src="/usha-logo-white.png" alt="Usha Makeup and Nails" /></a>
          <span className="contact-brand-line" aria-hidden="true" />
          <p>Makeup and nails in New Baneshwor, Kathmandu.</p>
        </div>
        <div className="contact-columns">
          <nav className="contact-navigation" aria-label="Footer navigation">
            <h2>Navigate</h2>
            <a className="contact-nav-home" href="/#home">Home</a>
            <a className="contact-nav-works" href="/#works">Our works</a>
            <a className="contact-nav-about" href="/#about">About us</a>
            {currentPage !== "academy" && <a className="contact-nav-academy" href="/academy">Academy</a>}
            <a className="contact-nav-contact" href="#contact">Contact</a>
            {currentPage !== "booking" && <a className="contact-nav-book" href="/book"><span className="contact-nav-book-desktop">Book an appointment</span><span className="contact-nav-book-mobile">Book</span></a>}
          </nav>
          <div className="contact-side">
            <h2>Contact</h2>
            <div className="contact-details">
              <a href="tel:+9779817077567" className="contact-detail"><i className="fi fi-rr-phone-call" aria-hidden="true" /><span>+977 9817077567</span></a>
              <div className="contact-detail"><i className="fi fi-rr-marker" aria-hidden="true" /><span>New Baneshwor, Kathmandu</span></div>
              <a href="mailto:ushamua02@gmail.com" className="contact-detail"><i className="fi fi-rr-envelope" aria-hidden="true" /><span>ushamua02@gmail.com</span></a>
            </div>
          </div>
          <div className="contact-follow">
            <h2>Follow us</h2>
            <div className="contact-socials" aria-label="Social media and WhatsApp">
              <a href="https://www.instagram.com/usha.mua02/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i className="fi fi-brands-instagram" aria-hidden="true" /></a>
              <a href="https://www.facebook.com/usha.rai.5851127" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><i className="fi fi-brands-facebook" aria-hidden="true" /></a>
              <a href="https://www.tiktok.com/@usha.mua02?lang=en" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i className="fi fi-brands-tik-tok" aria-hidden="true" /></a>
              <a href="https://wa.me/9779817077567" target="_blank" rel="noopener noreferrer" aria-label="Message Usha on WhatsApp"><i className="fi fi-brands-whatsapp" aria-hidden="true" /></a>
            </div>
          </div>
        </div>
        <div className="contact-bottom">
          <div className="contact-copyright"><p>copyright © 2026 usha makeup &amp; nails, all rights reserved</p></div>
          <p className="contact-designer">Designed by milangfx</p>
        </div>
      </footer>
  );
}
