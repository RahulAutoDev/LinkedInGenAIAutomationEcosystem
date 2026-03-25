import os
import sys
import logging
import time

# Ensure tools can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from crewai import Crew, Process
from agents import LinkedInAgents
from tasks import LinkedInTasks
from dotenv import load_dotenv

load_dotenv()

# Configure basic logging for performance tracking
logging.basicConfig(
    filename='data/crewai_performance.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("CrewAI_Orchestrator")

def task_callback(output):
    logger.info(f"Task completed. Output snippet: {str(output.raw_output)[:100]}...")

def step_callback(step):
    logger.info(f"Agent step executed: {step}")

def run_orchestrator():
    print("--- 🚀 Starting CrewAI LinkedIn Post Orchestrator ---")
    logger.info("Starting new CrewAI Orchestration Cycle")
    
    agents = LinkedInAgents()
    tasks = LinkedInTasks()
    
    start_time = time.time()
    
    # Initialize the Crew with Memory, Logging, and Callbacks
    linkedin_crew = Crew(
        agents=[
            agents.topic_agent(),
            agents.content_agent(),
            agents.diagram_agent(),
            agents.reviewer_agent(),
            agents.publisher_agent()
        ],
        tasks=[
            tasks.topic_selection_task(),
            tasks.content_drafting_task(),
            tasks.diagram_generation_task(),
            tasks.compliance_review_task(),
            tasks.publishing_task()
        ],
        process=Process.sequential,
        memory=True,  # Enables short-term, long-term, and entity memory
        embedder={
            "provider": "google",
            "config": {
                "model": "models/embedding-001",
                "api_key": os.environ.get("GEMINI_API_KEY")
            }
        },
        verbose=True,
        output_log_file='data/crewai_execution.log',
        task_callback=task_callback,
        step_callback=step_callback
    )
    
    # Kickoff the pipeline
    try:
        result = linkedin_crew.kickoff()
        end_time = time.time()
        duration = end_time - start_time
        
        print("\n=== 🏁 Final Orchestration Result ===")
        print(result)
        
        print("\n=== 📊 Performance Tracking ===")
        print(f"Total Execution Time: {duration:.2f} seconds")
        if hasattr(linkedin_crew, 'usage_metrics'):
            print(f"Token Usage: {linkedin_crew.usage_metrics}")
            logger.info(f"Cycle completed in {duration:.2f}s. Usage: {linkedin_crew.usage_metrics}")
        else:
            logger.info(f"Cycle completed in {duration:.2f}s.")
            
    except Exception as e:
        logger.error(f"Error during Crew execution: {str(e)}", exc_info=True)
        print(f"\n❌ Error during Crew execution: {str(e)}")

if __name__ == "__main__":
    os.makedirs('data', exist_ok=True)
    run_orchestrator()
