from crewai.tools import tool
import json
import os

@tool("Topic Deduplication Vector DB Tool")
def vector_db_dedupe_tool(topic: str) -> str:
    """
    Checks the local database for semantically similar topics previously posted.
    Input: The proposed topic string.
    Output: Returns a boolean-like string ('True' or 'False') indicating if the topic is a duplicate.
    If 'True', the agent MUST discard the topic and choose a new one.
    """
    try:
        # Mock VectorDB similarity search logic for deduplication
        posted_topics_file = os.path.join(os.getcwd(), 'data', 'posted_topics.json')
        if not os.path.exists(posted_topics_file):
            return "False" # No history yet
            
        with open(posted_topics_file, 'r') as f:
            topics = json.load(f)
            
        topic_lower = topic.lower()
        for past_topic in topics:
            if topic_lower in past_topic.lower() or past_topic.lower() in topic_lower:
                return "True"
                
        return "False"
    except Exception as e:
        return f"Error connecting to Vector DB: {str(e)}"
