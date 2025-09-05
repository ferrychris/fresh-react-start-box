import React from 'react';
import { Header } from '../components/Header';
import FastGrandstand from '../components/optimized/FastGrandstand';

export default function Grandstand() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <FastGrandstand />
      </main>
    </div>
  );
}