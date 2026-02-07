import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Image, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  // const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (!loading && user) {
  //     navigate('/dashboard');
  //   }
  // }, [user, loading, navigate]);

  const handleGetStarted = () => {
    alert("This is just a landing page template! You can find your working generator at http://localhost:3000");
    // if (user) {
    //   navigate('/dashboard');
    // } else {
    //   navigate('/auth');
    // }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-glow opacity-60" />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(hsl(0 84% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 84% 50%) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-6 md:px-12"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-crimson rounded-xl flex items-center justify-center glow-crimson">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-gradient">PixelForge</span>
          </div>
          <Button variant="premium-outline" onClick={handleGetStarted}>
            Get Started
          </Button>
        </motion.nav>

        {/* Hero Section */}
        <main className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8"
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">10 Free Daily Credits</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
                <span className="text-gradient">Transform Ideas</span>
                <br />
                <span className="text-foreground">Into Art</span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Harness the power of AI to create stunning, unique images from simple text descriptions. 
                Premium quality, zero artistic skills required.
              </p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button variant="premium" size="xl" onClick={handleGetStarted}>
                  Start Creating
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid md:grid-cols-3 gap-6 mt-24"
            >
              {[
                {
                  icon: Sparkles,
                  title: "AI-Powered",
                  description: "Advanced AI models create stunning visuals from your imagination"
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Generate high-quality images in seconds, not minutes"
                },
                {
                  icon: Image,
                  title: "Download & Share",
                  description: "Download your creations instantly and share anywhere"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="glass-card rounded-2xl p-6 text-center hover:glass-card-glow transition-all duration-300"
                >
                  <div className="w-14 h-14 gradient-crimson rounded-xl flex items-center justify-center mx-auto mb-4 glow-crimson">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
