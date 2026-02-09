/**
 * Test Gemini API Connection
 * Run with: npx ts-node scripts/test-gemini.ts
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function testGemini() {
    console.log('🧪 Testing Gemini API Connection...\n');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env');
        process.exit(1);
    }

    console.log('✅ API Key found');
    console.log(`   Key prefix: ${apiKey.substring(0, 10)}...`);

    try {
        const genAI = new GoogleGenAI({ apiKey });

        console.log('\n📡 Testing gemini-3-flash-preview model...');
        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: 'Say "Hello from Aletheia!" in exactly 5 words.'
        });

        // Extract text from response
        let text = '';
        const responseAny = response as any;

        // Try response.response.text() method
        if (responseAny.response && typeof responseAny.response.text === 'function') {
            text = responseAny.response.text();
        }
        // Fallback: try direct text property
        else if (typeof responseAny.text === 'string') {
            text = responseAny.text;
        }
        // Fallback: try candidates structure
        else if (responseAny.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            text = responseAny.response.candidates[0].content.parts[0].text;
        }

        if (text) {
            console.log('✅ Model responded successfully!');
            console.log(`   Response: "${text.trim()}"`);
        } else {
            console.log('⚠️  Model responded but text extraction failed');
            console.log('   Response structure:', JSON.stringify(responseAny, null, 2).substring(0, 500));
        }

        console.log('\n✅ Gemini API is working correctly!');
        console.log('\n💡 Tips:');
        console.log('   - gemini-3-flash-preview is active (rate limit friendly)');
        console.log('   - Switch to gemini-3-flash-preview when rate limits allow');
        console.log('   - Text extraction handles multiple SDK response formats');

    } catch (error: any) {
        console.error('\n❌ Gemini API test failed:');
        console.error('   Error:', error.message);
        if (error.response) {
            console.error('   Response:', error.response);
        }
        process.exit(1);
    }
}

testGemini();
