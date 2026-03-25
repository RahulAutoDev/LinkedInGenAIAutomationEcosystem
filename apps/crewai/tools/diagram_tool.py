from crewai.tools import tool
import os
import subprocess
import tempfile
import uuid

@tool("Mermaid Diagram Renderer Tool")
def mmdc_render_tool(mermaid_syntax: str) -> str:
    """
    Renders Mermaid.js syntax to a PNG image file using the mmdc CLI. 
    Input: The raw mermaid.js string (e.g., 'graph TD; A-->B;'). 
    Output: Returns the file path to the generated PNG image or an error message if rendering failed.
    """
    try:
        tmp_dir = os.path.join(os.getcwd(), 'data', 'drafts')
        os.makedirs(tmp_dir, exist_ok=True)
        
        file_id = str(uuid.uuid4())[:8]
        mmd_file = os.path.join(tmp_dir, f"diagram_{file_id}.mmd")
        png_file = os.path.join(tmp_dir, f"diagram_{file_id}.png")
        
        # Write syntax to temporary file
        with open(mmd_file, 'w') as f:
            f.write(mermaid_syntax)
            
        # Call mmdc
        result = subprocess.run(
            ['npx', 'mmdc', '-i', mmd_file, '-o', png_file, '--puppeteerConfigFile', './puppeteer-config.json'],
            capture_output=True,
            text=True
        )
        
        if os.path.exists(png_file):
            return f"Success! Diagram rendered to: {png_file}"
        else:
            return f"Failed to render diagram. stderr: {result.stderr}"
    except Exception as e:
        return f"Exception occurred while rendering diagram: {str(e)}"
