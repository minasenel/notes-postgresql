import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def summarize_note(content, max_words=100):
    """
    Summarize note content using Gemini API
    """
    try:
        # Configure Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return "Error: GEMINI_API_KEY not found in environment variables"
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Create prompt for summarization
        prompt = f"""Summarize the following text in exactly {max_words} words or less. 
        Be concise and capture the main points. Return only the summary, no additional text:

        {content}"""
        
        # Generate summary
        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        return f"Error generating summary: {str(e)}"

def test_gemini_connection():
    """
    Test if Gemini API is working
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return False, "GEMINI_API_KEY not found"
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("Hello, this is a test.")
        return True, "Connection successful"
    except Exception as e:
        return False, f"Connection failed: {str(e)}"
