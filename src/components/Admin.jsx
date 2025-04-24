import React, { useState } from 'react';
import { Button } from './ui/button';

const API_ENDPOINTS = [
  {
    label: 'Gold TH',
    url: 'https://gold-predictions.duckdns.org/finnomenaGold/fetch-gold-data/?db_choice=0',
  },
  {
    label: 'Gold US',
    url: 'https://gold-predictions.duckdns.org/finnomenaGold/fetch-gold-data/?db_choice=1',
  },
  {
    label: 'USD/THB',
    url: 'https://gold-predictions.duckdns.org/currency/update-daily-usdthb?auto=True',
  },
  {
    label: 'Clear Cache',
    url: 'https://gold-predictions.duckdns.org/redis/clear/'
  }
];

export default function Admin() {
  const [results, setResults] = useState([null, null, null, null]);
  const [loading, setLoading] = useState([false, false, false, false]);

  const handleFetch = async (idx, url) => {
    setLoading(l => l.map((v, i) => (i === idx ? true : v)));
    try {
      const res = await fetch(url);
      const json = await res.json();
      setResults(r => r.map((v, i) => (i === idx ? json : v)));
    } catch (e) {
      setResults(r => r.map((v, i) => (i === idx ? { error: e.message } : v)));
    } finally {
      setLoading(l => l.map((v, i) => (i === idx ? false : v)));
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <h2 className="text-2xl font-bold mb-6">Admin: Trigger Daily Data Update</h2>
      <div className="space-y-6">
        {API_ENDPOINTS.map((api, idx) => (
          <div key={api.label} className="border rounded-lg p-4 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-4 mb-2">
              <Button onClick={() => handleFetch(idx, api.url)} disabled={loading[idx]}>
                {loading[idx] ? 'Loading...' : `GET ${api.label}`}
              </Button>
              <span className="text-sm text-gray-700 dark:text-gray-200">{api.url}</span>
            </div>
            <div className="text-xs bg-gray-100 dark:bg-gray-800 rounded p-2 overflow-x-auto min-h-[40px]">
              {results[idx] ? (
                <pre className="whitespace-pre-wrap break-all">{JSON.stringify(results[idx], null, 2)}</pre>
              ) : (
                <span className="text-gray-400">No response yet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}