import React, { useState } from "react";
import DropdownExample from "./DropdownExample";
import GoldDataDropdown, { TimeframeDropdown } from "./GoldDataDropdown";
import SettingsDropdown from "./SettingsDropdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useTheme } from "./theme-provider";
import { toast } from "./ui/use-toast.jsx";

const ComponentsShowcase = () => {
  const [selectedCategory, setSelectedCategory] = useState("gold_th");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const { setTheme } = useTheme();

  const handleThemeChange = (theme) => {
    setTheme(theme);
    toast({
      title: "Theme Changed",
      description: `Theme has been changed to ${theme}`,
    });
  };

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">UI Components Showcase</h1>
      
      <Tabs defaultValue="dropdowns" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dropdowns">Dropdowns</TabsTrigger>
          <TabsTrigger value="goldDropdowns">Gold Data Dropdowns</TabsTrigger>
          <TabsTrigger value="settingsDropdown">Settings Dropdown</TabsTrigger>
          <TabsTrigger value="other">Other Components</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dropdowns">
          <Card>
            <CardHeader>
              <CardTitle>Dropdown Menu Examples</CardTitle>
              <CardDescription>
                Various examples of dropdown menus using Radix UI components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DropdownExample />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goldDropdowns">
          <Card>
            <CardHeader>
              <CardTitle>Gold Data Dropdowns</CardTitle>
              <CardDescription>
                Specialized dropdowns for the Gold Prediction application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
                <div>
                  <h3 className="text-lg font-medium mb-4">Data Category Selection</h3>
                  <GoldDataDropdown 
                    selectedCategory={selectedCategory} 
                    onCategoryChange={setSelectedCategory} 
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {selectedCategory}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Timeframe Selection</h3>
                  <TimeframeDropdown 
                    selectedTimeframe={selectedTimeframe} 
                    onTimeframeChange={setSelectedTimeframe} 
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {selectedTimeframe}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settingsDropdown">
          <Card>
            <CardHeader>
              <CardTitle>Settings Dropdown</CardTitle>
              <CardDescription>
                A comprehensive settings dropdown for application configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center p-4">
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4 text-center">Settings Menu (Click the icon)</h3>
                  <div className="flex justify-center">
                    <SettingsDropdown 
                      onThemeChange={handleThemeChange}
                      onLogout={handleLogout}
                    />
                  </div>
                </div>
                
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4 text-center">Settings Menu with User (Click the icon)</h3>
                  <div className="flex justify-center">
                    <SettingsDropdown 
                      user={{ name: "John Doe", email: "john@example.com" }}
                      onThemeChange={handleThemeChange}
                      onLogout={handleLogout}
                    />
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md w-full max-w-lg">
                  <h4 className="font-medium mb-2">Usage Notes:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>The settings dropdown provides access to user account, preferences, and actions</li>
                    <li>Theme changes will be applied to the entire application</li>
                    <li>The dropdown adapts based on whether a user is logged in</li>
                    <li>Sub-menus provide additional options without cluttering the main dropdown</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="other">
          <Card>
            <CardHeader>
              <CardTitle>Other Components</CardTitle>
              <CardDescription>
                This section will showcase other UI components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                More components will be added here in the future.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComponentsShowcase; 