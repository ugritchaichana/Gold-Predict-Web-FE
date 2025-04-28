import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThreeDot } from 'react-loading-indicators';

const DocumentPage = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading VitePress content
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/10">
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <ThreeDot color={["#32cd32", "#327fcd", "#cd32cd", "#cd8032"]} />
            </div>
          ) : (
            <div className="vitepress-demo">
              <div className="p-4 border rounded-lg mb-6 bg-card">
                <h2 className="text-xl font-bold mb-2">VitePress Demo Page</h2>
                <p className="text-muted-foreground mb-4">
                  This is a simplified demo of what a VitePress documentation site would look like.
                  In a real implementation, VitePress would generate static documentation pages.
                </p>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h3 className="font-semibold mb-2">Getting Started</h3>
                    <p className="text-sm text-muted-foreground">
                      Learn how to set up and start using the Gold Prediction system
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h3 className="font-semibold mb-2">API Reference</h3>
                    <p className="text-sm text-muted-foreground">
                      Explore the available API endpoints and how to use them
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h3 className="font-semibold mb-2">Components</h3>
                    <p className="text-sm text-muted-foreground">
                      Overview of the components used in the application
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <h3 className="font-semibold mb-2">Model Training</h3>
                    <p className="text-sm text-muted-foreground">
                      Details about how the prediction models are trained
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-amber-50/50 dark:bg-amber-900/20 rounded-lg">
                  <h3 className="font-semibold mb-2">Sample Documentation</h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <p>
                      Gold price prediction uses advanced machine learning models to forecast future trends.
                      Our system analyzes historical data patterns to provide accurate predictions.
                    </p>
                    
                    <h4 className="mt-4">Code Example</h4>
                    <pre className="bg-black/80 text-green-400 p-3 rounded overflow-auto">
                      <code>
{`// Example API call
const fetchPrediction = async () => {
  const response = await fetch('/api/predict/gold');
  const data = await response.json();
  return data;
};`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6 text-muted-foreground text-sm">
                <p>This is a demo of what a VitePress documentation site would look like.</p>
                <p className="mt-2">
                  For a full implementation, you would need to set up VitePress properly 
                  and create markdown documentation files.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentPage;
