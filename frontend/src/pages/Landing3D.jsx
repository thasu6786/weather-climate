import { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Globe2, Map, BarChart3, Wallet, ArrowRight, Zap, Target } from 'lucide-react';

/* -------------------------------------------------------------------------------------------------
 * KINETIC WEATHER ENGINE COMPONENTS
 * ------------------------------------------------------------------------------------------------- */
const VectorCloud = ({ opacity, y, scale, duration, delay, reverse }) => (
  <motion.svg 
    viewBox="0 0 512 512" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      position: 'absolute', 
      width: '50vw', 
      minWidth: '400px',
      opacity, 
      top: y, 
      scale,
      zIndex: 1,
      filter: 'blur(2px)',
      pointerEvents: 'none'
    }}
    animate={{ x: reverse ? ['120vw', '-60vw'] : ['-60vw', '120vw'] }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <path 
      fill="#E2E8F0" 
      d="M400,224c-11.8,0-23.2,1.8-33.9,5.2C350.5,152.1,281.8,96,192,96c-76.3,0-141.4,47.2-171.4,114.7 C8.2,217.4,0,228.3,0,240c0,26.5,21.5,48,48,48h96v32H48c-44.2,0-80-35.8-80-80c0-21,8.1-40.2,21.3-54.6 C2.6,155.1,16,113.6,48,80C86.6,39.4,143.2,16,204,16c80.9,0,154.2,43.4,193.3,112.5C418.6,120.3,446.5,112,480,112 c53,0,96,43,96,96c0,44.7-30.8,82.2-72.3,93.2C508.8,304.8,512,308.3,512,312v32c0,13.3-10.7,24-24,24H400c-35.3,0-64-28.7-64-64 C336,259.8,364.7,224,400,224z" 
    />
    <path 
      fill="#F8FAFC"
      d="M344,192c-29.2,0-54.2,18.7-65.4,44.8C270.8,233.5,261.6,232,252,232c-35.3,0-64,28.7-64,64c0,3.3,0.3,6.5,0.7,9.7 C181.5,301.7,176,293.4,176,284c0-26.5,21.5-48,48-48c9.6,0,18.8,2.5,26.6,7.2C259.7,215,283.4,196,312,196c30.2,0,55.1,21.4,62.1,49.8 c1.3,5.4,6.2,9.1,11.7,9.1c11.7,0,21.5,8.8,22.8,20.4c1.6,14.4,13.8,25.4,28.2,25.4h48c9.3,0,16,7.2,16,16c0,8.8-7.2,16-16,16h-48 c-30.9,0-56-25.1-56-56c0-4.6,0.6-9.1,1.6-13.4C374.8,227.1,360.7,192,344,192z"
    />
  </motion.svg>
);

const DataRain = () => {
  const rainDrops = useMemo(() => [...Array(40)].map((_, i) => ({
    left: `${Math.random() * 100}%`,
    duration: Math.random() * 2 + 1.5,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.4 + 0.1,
    height: Math.random() * 30 + 15
  })), []);

  return (
    <div className="data-rain-container">
      {rainDrops.map((drop, i) => (
        <motion.div
           key={`rain-${i}`}
           className="rain-drop"
           style={{ left: drop.left, height: drop.height, opacity: drop.opacity }}
           animate={{ y: ['-10vh', '110vh'] }}
           transition={{ duration: drop.duration, repeat: Infinity, ease: 'linear', delay: drop.delay }}
        />
      ))}
    </div>
  );
};

const WindVectors = () => {
  const winds = useMemo(() => [...Array(12)].map((_, i) => ({
    top: `${Math.random() * 100}%`,
    duration: Math.random() * 6 + 4,
    delay: Math.random() * 8,
    width: Math.random() * 200 + 100
  })), []);

  return (
    <div className="wind-vectors-container">
      {winds.map((wind, i) => (
        <motion.div
           key={`wind-${i}`}
           className="wind-line"
           style={{ top: wind.top, width: wind.width }}
           animate={{ x: ['-200px', '120vw'], opacity: [0, 0.4, 0] }}
           transition={{ duration: wind.duration, repeat: Infinity, ease: 'easeInOut', delay: wind.delay }}
        />
      ))}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * 3D Parallax Hover Card for the 'Our Approach' Gallery
 * ------------------------------------------------------------------------------------------------- */
const ProjectPillarCard = ({ title, desc, icon: Icon, delay }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay }}
      style={{ perspective: 1000 }}
      className="pillar-card-wrapper"
    >
      <motion.div style={{ rotateX, rotateY }} className="pillar-glass-card">
        <div className="pillar-icon-ring"><Icon size={28} strokeWidth={1.5} /></div>
        <h3 className="pillar-title">{title}</h3>
        <p className="pillar-desc">{desc}</p>
      </motion.div>
    </motion.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Main Google-Tier Landing Page
 * ------------------------------------------------------------------------------------------------- */
export default function Landing3D() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  const yHero = useTransform(scrollYProgress, [0, 0.5], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <div className="landing-google-page">
      
      {/* 1. Kinetic Weather Background */}
      <div className="google-sky-bg">
        {/* Kinetic Cloud Vectors mapped at multiple Depths */}
        <VectorCloud opacity={0.06} y="5%" scale={1.8} duration={40} delay={0} reverse={false} />
        <VectorCloud opacity={0.04} y="30%" scale={1.2} duration={30} delay={10} reverse={true} />
        <VectorCloud opacity={0.08} y="60%" scale={2.4} duration={60} delay={5} reverse={false} />
        <VectorCloud opacity={0.05} y="15%" scale={0.8} duration={25} delay={20} reverse={true} />
        
        {/* Digital Data Rain */}
        <DataRain />

        {/* High-Speed Winds */}
        <WindVectors />
      </div>

      {/* 2. Unboxed Hero Section */}
      <section className="google-hero-section">
        <motion.div style={{ y: yHero, opacity: opacityHero }} className="hero-unboxed-content">
          
          <motion.div 
            className="google-badge" 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <span className="live-pulse-green" /> Kinetic Engine Active
          </motion.div>

          <motion.h1 
            className="google-massive-title" 
            initial={{ opacity: 0, y: 40 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-thin">URBAN CLIMATE</span>
            <span className="font-black bg-gradient-sky">INTELLIGENCE</span>
          </motion.h1>

          <motion.p 
            className="google-hero-subtitle" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.8, duration: 1 }}
          >
            An innovative, high-fidelity environmental mapping matrix. Synchronizing live atmospheric nodes, 
            smart planetary travel routing, and shared ecosystem tracking into a single elegant engine.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1, duration: 0.8 }}
          >
            <button className="google-cta-glass" onClick={() => navigate('/overview')}>
              Access Dashboard <ArrowRight size={22} className="hover-arrow" />
            </button>
          </motion.div>

        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="scroll-indicator"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
        >
          <motion.div 
            animate={{ height: ['0%', '100%'], opacity: [0, 1, 0] }} 
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="scroll-line"
          />
        </motion.div>
      </section>

      {/* 3. "Our Approach" Project Showcase Gallery */}
      <section className="google-approach-section">
        <motion.div 
          className="approach-header"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        >
          <div className="approach-icon"><Target size={24} color="#38BDF8" strokeWidth={2.5}/></div>
          <h2>Our Core Approach</h2>
          <p>Four distinct technological pillars driving real-time intelligence and community synergy.</p>
        </motion.div>

        <div className="pillars-grid">
          <ProjectPillarCard 
            title="Live Climate Analytics" 
            desc="Ingesting 84M+ global thermal signatures and air quality indexes for immediate synoptic visual feedback via interactive radar layers." 
            icon={Zap} delay={0.1} 
          />
          <ProjectPillarCard 
            title="Smart Eco-Routing" 
            desc="Graphing geographical algorithms to establish the safest planetary routes, intelligently evading harsh weather systems and high pollution zones." 
            icon={Map} delay={0.2} 
          />
          <ProjectPillarCard 
            title="Visualization Matrix" 
            desc="Synthesizing raw atmospheric variables into complex, interactive data-art via deeply modular scatter plots, heatmaps, and trend engines." 
            icon={BarChart3} delay={0.3} 
          />
          <ProjectPillarCard 
            title="Expense Ecosystem" 
            desc="A seamless collaborative financial hub for teams and families, tracking eco-travel spending, algorithmic settlement, and budget progress natively." 
            icon={Wallet} delay={0.4} 
          />
        </div>
      </section>

      {/* 4. Minimal Google Footer */}
      <footer className="google-footer">
        <div><Globe2 size={16} color="#38BDF8" /> Urban Climate Intelligence Engine</div>
        <div style={{ opacity: 0.6 }}>Designed for high-performance atmospheric tracking.</div>
      </footer>

    </div>
  );
}
