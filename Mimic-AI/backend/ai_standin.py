"""
AI Stand-In — Uses Groq API to reply as a user when they're offline.
Loads their WhatsApp chat export for few-shot examples to mimic their style.
"""

import os
from groq import Groq
from models import get_chat_export, get_user_by_id, get_chat_history

# Initialize Groq client
client = None


def init_groq():
    """Initialize the Groq client with API key from environment."""
    global client
    api_key = os.getenv('GROQ_API_KEY')
    if api_key:
        client = Groq(api_key=api_key)
        print("[OK] Groq AI client initialized")
    else:
        print("[WARN] GROQ_API_KEY not set -- AI stand-in will be disabled")


def get_few_shot_examples(user_id, max_examples=20):
    """
    Get few-shot examples from the user's WhatsApp chat export.
    Returns interleaved user/assistant messages for the Groq API.
    """
    export = get_chat_export(user_id)
    if not export:
        return []

    messages = export['parsed_messages']
    contact_name = export['contact_name']

    # Get the user's display name
    user = get_user_by_id(user_id)
    user_name = user['display_name'] if user else 'User'

    # Build few-shot examples from the chat history
    # We want pairs: someone says something → the user replies
    examples = []
    for i in range(len(messages) - 1):
        current = messages[i]
        next_msg = messages[i + 1]

        # Look for pattern: contact sends message → user replies
        if current['sender'] != user_name and next_msg['sender'] == user_name:
            # Skip very short or media messages
            if len(next_msg['message']) < 2:
                continue

            examples.append({
                'incoming': current['message'],
                'reply': next_msg['message']
            })

        if len(examples) >= max_examples:
            break

    return examples


def build_system_prompt(user):
    """Build the system prompt for the AI stand-in."""
    name = user['display_name']

    return f"""You are {name}. You are replying to messages on behalf of {name} because they are currently unavailable.

CRITICAL RULES:
1. Reply EXACTLY as {name} would — same tone, language, slang, emoji usage, abbreviations, and message length.
2. If {name} uses Hinglish (mix of Hindi and English), you MUST reply in Hinglish too.
3. If {name} uses short messages, keep yours short. If they write long messages, write longer ones.
4. Match their punctuation style — if they skip periods, you skip them too.
5. Match their capitalization — if they type in all lowercase, you do the same.
6. DO NOT be overly formal or polished. Be natural and casual like the real person.
7. DO NOT mention that you are an AI or a bot. Just reply naturally.
8. Keep responses brief and conversational — like a real chat message, not an essay.
9. If you're unsure what to say, give a short, non-committal but friendly reply."""


def generate_ai_reply(offline_user_id, incoming_message, sender_name):
    """
    Generate an AI reply on behalf of the offline user.
    
    Args:
        offline_user_id: The ID of the user who is offline (the AI replies as them)
        incoming_message: The message that was sent to the offline user
        sender_name: The name of the person who sent the message
    
    Returns:
        The AI-generated reply string, or None if AI is unavailable.
    """
    if not client:
        return None

    user = get_user_by_id(offline_user_id)
    if not user:
        return None

    # Build the messages array for Groq
    messages = []

    # System prompt
    messages.append({
        'role': 'system',
        'content': build_system_prompt(user)
    })

    # Add few-shot examples from WhatsApp export
    examples = get_few_shot_examples(offline_user_id)
    for ex in examples:
        messages.append({'role': 'user', 'content': ex['incoming']})
        messages.append({'role': 'assistant', 'content': ex['reply']})

    # Also add recent chat history in this app for context
    recent_history = get_chat_history(offline_user_id, offline_user_id, limit=10)
    # (This gives recent conversation context if any exists)

    # The actual incoming message
    messages.append({
        'role': 'user',
        'content': incoming_message
    })

    try:
        response = client.chat.completions.create(
            model=os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile'),
            messages=messages,
            temperature=0.7,
            max_tokens=150,
            top_p=0.9,
        )

        reply = response.choices[0].message.content.strip()
        return reply

    except Exception as e:
        print(f"[ERROR] Groq API error: {e}")
        return None
