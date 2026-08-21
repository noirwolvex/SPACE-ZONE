import Link from "next/link";

export default function IntroPage() {
  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex items-center justify-center intro-container">
      {/* Inline styles for the specific Intro animations to keep it self-contained */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .intro-container {
            background: radial-gradient(circle at center, #0a1128 0%, #000000 70%);
          }
          
          /* Fade in everything */
          .cinematic-fade-in {
            animation: fadeIn 3s ease-in-out forwards;
          }

          /* Small stars/particles */
          .intro-stars {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 10px 2px white;
            animation: twinkle 4s infinite alternate;
          }

          /* The rotating orbit ring */
          .orbit-ring {
            position: absolute;
            width: 600px;
            height: 600px;
            border: 1px solid rgba(100, 150, 255, 0.15);
            border-radius: 50%;
            box-shadow: inset 0 0 40px rgba(100, 150, 255, 0.05), 0 0 40px rgba(100, 150, 255, 0.05);
            animation: rotateOrbit 30s linear infinite;
            opacity: 0;
            animation: rotateOrbit 30s linear infinite, fadeInOrbit 4s ease-in-out 1s forwards;
          }
          
          /* Inner glowing ring */
          .orbit-ring-inner {
            position: absolute;
            width: 400px;
            height: 400px;
            border: 1px dashed rgba(100, 150, 255, 0.3);
            border-radius: 50%;
            animation: rotateOrbitReverse 20s linear infinite, fadeInOrbit 4s ease-in-out 1.5s forwards;
            opacity: 0;
          }

          /* Center glowing core */
          .core-glow {
            position: absolute;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle at center, rgba(37, 99, 235, 0.3) 0%, transparent 70%);
            filter: blur(20px);
            animation: pulseGlow 4s ease-in-out infinite alternate, fadeIn 3s ease-in-out forwards;
          }

          /* Horizon line behind text */
          .horizon-line {
            position: absolute;
            width: 80%;
            max-width: 800px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
            opacity: 0;
            animation: expandHorizon 2.5s ease-out 1s forwards;
          }

          /* Main Title */
          .title-spacezone {
            font-family: 'Space Grotesk', system-ui, sans-serif;
            font-size: clamp(2rem, 8vw, 6rem);
            font-weight: 300;
            letter-spacing: 14px;
            color: #ffffff;
            text-transform: uppercase;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
            opacity: 0;
            transform: scale(0.9);
            animation: titleReveal 4s cubic-bezier(0.2, 0.8, 0.2, 1) 1.5s forwards;
            z-index: 10;
            margin-right: -14px; /* compensate for letter spacing on last char */
          }

          /* Enter Button */
          .enter-button {
            position: absolute;
            bottom: 15%;
            opacity: 0;
            animation: fadeIn 2s ease-in-out 4s forwards;
            z-index: 20;
          }

          /* Tiny crosshairs */
          .crosshair {
            position: absolute;
            width: 10px;
            height: 10px;
            opacity: 0.5;
          }
          .crosshair::before, .crosshair::after {
            content: '';
            position: absolute;
            background: rgba(255, 255, 255, 0.6);
          }
          .crosshair::before { top: 50%; left: 0; right: 0; height: 1px; transform: translateY(-50%); }
          .crosshair::after { left: 50%; top: 0; bottom: 0; width: 1px; transform: translateX(-50%); }

          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          
          @keyframes fadeInOrbit {
            0% { opacity: 0; transform: scale(0.8) rotate(0deg); }
            100% { opacity: 1; transform: scale(1) rotate(45deg); }
          }

          @keyframes pulseGlow {
            0% { transform: scale(1); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 1; }
          }

          @keyframes expandHorizon {
            0% { width: 0%; opacity: 0; }
            50% { opacity: 1; }
            100% { width: 80%; opacity: 0.3; }
          }

          @keyframes titleReveal {
            0% { opacity: 0; transform: scale(0.9); filter: blur(10px); }
            100% { opacity: 1; transform: scale(1); filter: blur(0px); }
          }

          @keyframes rotateOrbit {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes rotateOrbitReverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }

          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `
      }} />

      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="cinematic-fade-in absolute inset-0">
          {/* We spread a few fixed stars for cinematic effect */}
          <div className="intro-stars" style={{ top: '20%', left: '30%', animationDelay: '0.5s' }} />
          <div className="intro-stars" style={{ top: '60%', left: '80%', animationDelay: '1.2s' }} />
          <div className="intro-stars" style={{ top: '80%', left: '20%', animationDelay: '2s' }} />
          <div className="intro-stars" style={{ top: '30%', left: '70%', animationDelay: '0.8s' }} />
          <div className="intro-stars" style={{ top: '50%', left: '10%', animationDelay: '1.5s' }} />
          
          {/* Subtle crosshairs around the focal point */}
          <div className="crosshair" style={{ top: '30%', left: '40%' }} />
          <div className="crosshair" style={{ top: '70%', left: '60%' }} />
        </div>
      </div>

      {/* Orbit Rings (Faint circular borders) */}
      <div className="orbit-ring z-0" />
      <div className="orbit-ring-inner z-0" />
      
      {/* Smoky / Glowing core in the center */}
      <div className="core-glow z-0" />

      {/* Horizon glow line slicing through the text */}
      <div className="horizon-line z-0" />

      {/* Center Text */}
      <h1 className="title-spacezone relative z-10 flex flex-col items-center">
        SPACEZONE
        <span className="block text-sm sm:text-base tracking-[0.3em] text-blue-300 mt-4 opacity-70 font-normal uppercase">
          Agency
        </span>
      </h1>

      {/* Back to Home / Enter Main Site Button */}
      <div className="enter-button">
        <Link 
          href="/" 
          className="flex items-center gap-3 px-8 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 uppercase tracking-widest text-sm"
        >
          Enter Platform 
          <span className="text-blue-400">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
