from crewai import Agent
from langchain_google_genai import ChatGoogleGenerativeAI
import os
from dotenv import load_dotenv
from tools.diagram_tool import mmdc_render_tool
from tools.vector_db_tool import vector_db_dedupe_tool

load_dotenv()

# Initialize Gemini model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0.7
)

class LinkedInAgents:
    def topic_agent(self):
        return Agent(
            role='Topic Planner',
            goal='Identify and select a high-value, non-duplicate topic for a LinkedIn post.',
            backstory='An expert content strategist who understands enterprise software, AI, and LinkedIn engagement trends.',
            verbose=True,
            allow_delegation=False,
            max_iter=5,
            tools=[vector_db_dedupe_tool],
            llm=llm
        )
        
    def content_agent(self):
        return Agent(
            role='Content Generator',
            goal='Draft a compelling LinkedIn post based on the selected topic, including an engaging hook, body, CTA, and 3-5 hashtags.',
            backstory='A senior AI architect and LinkedIn strategist known for clear, high-impact technical writing.',
            verbose=True,
            allow_delegation=False,
            max_iter=5,
            llm=llm
        )
        
    def diagram_agent(self):
        return Agent(
            role='Diagram Generator',
            goal='Extract concepts from the drafted post and generate valid Mermaid.js syntax for a flowchart, then render it using the mmdc tool.',
            backstory='A systems modeler who visualizes complex technical concepts into clean Mermaid.js diagrams.',
            verbose=True,
            allow_delegation=False,
            max_iter=5,
            tools=[mmdc_render_tool],
            llm=llm
        )
        
    def reviewer_agent(self):
        return Agent(
            role='Reviewer & Governance Gate',
            goal='Review the drafted post against brand safety, tone, and compliance rules. Issue a PASS or REVISE verdict.',
            backstory='A strict Chief Compliance Officer who ensures all external communications meet enterprise safety standards.',
            verbose=True,
            allow_delegation=False,
            max_iter=5,
            llm=llm
        )
        
    def publisher_agent(self):
        return Agent(
            role='Publisher',
            goal='Take the approved draft and perfectly format it for final publication on LinkedIn.',
            backstory='A meticulous social media manager who ensures formatting is perfect before going live.',
            verbose=True,
            allow_delegation=False,
            llm=llm
        )
