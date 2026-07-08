from typing import TypedDict, Annotated, Sequence
import operator
from langchain_core.messages import BaseMessage, HumanMessage
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel

class NexusState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    next_agent: str
    graph_context: str

class Route(BaseModel):
    next_agent: str

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")

def supervisor_node(state: NexusState):
    """Router that decides which specialized agent should handle the query."""
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the supervisor of an industrial knowledge intelligence system. "
                   "Given the user's query, decide whether to route it to 'graph_agent' (for questions about equipment relationships, downstream/upstream, or connectivity), "
                   "or 'doc_agent' (for questions about manuals, SOPs, maintenance history, or general document knowledge). "
                   "If the conversation is over, route to 'FINISH'."),
        ("user", "{input}")
    ])
    
    # We use a structured output to force the routing decision
    router = prompt | llm.with_structured_output(Route)
    
    # Use the last message as the input
    last_message = state["messages"][-1].content
    result = router.invoke({"input": last_message})
    
    return {"next_agent": result.next_agent}

def graph_agent(state: NexusState):
    """Queries the knowledge graph and returns context."""
    # In a full implementation, this would extract the equipment tag and query Neo4j
    # For now, we simulate a response
    response_msg = "Graph Agent: I checked the relationships. BF-P-07A is downstream of the main cooling tower and feeds Blast Furnace 2."
    return {"messages": [HumanMessage(content=response_msg)]}

def doc_agent(state: NexusState):
    """Retrieves documents and answers questions."""
    response_msg = "Doc Agent: According to the OEM manual, the bearing temperature alarm threshold is 80°C."
    return {"messages": [HumanMessage(content=response_msg)]}

def build_graph():
    workflow = StateGraph(NexusState)
    
    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("graph_agent", graph_agent)
    workflow.add_node("doc_agent", doc_agent)
    
    # Define routing logic
    workflow.set_entry_point("supervisor")
    
    workflow.add_conditional_edges(
        "supervisor",
        lambda x: x["next_agent"],
        {
            "graph_agent": "graph_agent",
            "doc_agent": "doc_agent",
            "FINISH": END
        }
    )
    
    workflow.add_edge("graph_agent", END)
    workflow.add_edge("doc_agent", END)
    
    return workflow.compile()

# Initialize the graph
nexus_graph = build_graph()

if __name__ == "__main__":
    # Test the graph
    inputs = {"messages": [HumanMessage(content="What equipment is downstream of BF-P-07A?")]}
    for output in nexus_graph.stream(inputs):
        for key, value in output.items():
            print(f"Output from node '{key}':")
            print("---")
            print(value)
        print("\n---\n")
