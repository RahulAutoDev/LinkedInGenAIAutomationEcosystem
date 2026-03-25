from crewai import Task
from agents import LinkedInAgents

agents = LinkedInAgents()
topic_agent = agents.topic_agent()
content_agent = agents.content_agent()
diagram_agent = agents.diagram_agent()
reviewer_agent = agents.reviewer_agent()
publisher_agent = agents.publisher_agent()

class LinkedInTasks:
    def topic_selection_task(self):
        return Task(
            description='Analyze the current enterprise AI landscape and the historical Vector DB `success_pattern` logs. Identify a high-value, non-duplicate topic. You MUST prioritize topics that semantically align with previously high-performing concepts. Exclude anything matching `rejection_pattern` structures.',
            expected_output='A clear, 1-2 sentence topic brief outlining the core angle, target audience, and why it is prioritized.',
            agent=topic_agent
        )

    def content_drafting_task(self):
        return Task(
            description='Draft a professional LinkedIn post based on the provided topic. You must avoid all patterns listed in previously rejected feedback logs (negative prompts). It must include a strong hook (Score >= 8/10), an analytical body, an engaging CTA, and 3-5 relevant hashtags.',
            expected_output='A fully drafted LinkedIn post text including hashtags.',
            agent=content_agent
        )

    def diagram_generation_task(self):
        return Task(
            description='Extract the architecture or flowchart concepts from the drafted post and write valid Mermaid.js syntax. Use the Mermaid Diagram Renderer Tool to compile the syntax into a PNG.',
            expected_output='The file path to the generated diagram PNG image.',
            agent=diagram_agent
        )

    def compliance_review_task(self):
        return Task(
            description='Review the drafted post for brand safety and technical accuracy. Generate a Quality Score (1-10) based on Value Density. If it violates any rules or scores below 8, return REVISE with the exact failure pattern. If it is safe and scores >= 8, return PASS.',
            expected_output='A final verdict (PASS or REVISE), a Quality Score (1-10), and extracted rejection patterns (if any).',
            agent=reviewer_agent
        )

    def publishing_task(self):
        return Task(
            description='Prepare the approved content for publication. Provide the final formatted payload that would be sent to the LinkedIn API.',
            expected_output='A JSON-formatted object representing the final LinkedIn API payload.',
            agent=publisher_agent,
            max_retries=3
        )
        )
