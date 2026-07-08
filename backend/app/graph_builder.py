import os
from neo4j import GraphDatabase

class Neo4jGraphBuilder:
    def __init__(self):
        # We will use environment variables for Neo4j connection
        # Default fallback to localhost
        self.uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.user = os.getenv("NEO4J_USER", "neo4j")
        self.password = os.getenv("NEO4J_PASSWORD", "password")
        self.driver = GraphDatabase.driver(self.uri, auth=(self.user, self.password))

    def close(self):
        self.driver.close()

    def add_equipment(self, tag: str, name: str, description: str = ""):
        with self.driver.session() as session:
            session.run(
                "MERGE (e:Equipment {tag: $tag}) "
                "ON CREATE SET e.name = $name, e.description = $description",
                tag=tag, name=name, description=description
            )

    def add_document(self, doc_id: str, title: str, doc_type: str):
        with self.driver.session() as session:
            session.run(
                "MERGE (d:Document {id: $doc_id}) "
                "ON CREATE SET d.title = $title, d.type = $doc_type",
                doc_id=doc_id, title=title, doc_type=doc_type
            )

    def link_equipment_to_document(self, equip_tag: str, doc_id: str, relation_type: str = "MENTIONED_IN"):
        with self.driver.session() as session:
            session.run(
                "MATCH (e:Equipment {tag: $equip_tag}) "
                "MATCH (d:Document {id: $doc_id}) "
                f"MERGE (e)-[r:{relation_type}]->(d)",
                equip_tag=equip_tag, doc_id=doc_id
            )

    def get_equipment_context(self, tag: str):
        with self.driver.session() as session:
            result = session.run(
                "MATCH (e:Equipment {tag: $tag})-[r]->(related) "
                "RETURN e, type(r) as relation, related",
                tag=tag
            )
            records = []
            for record in result:
                records.append({
                    "relation": record["relation"],
                    "related_node": dict(record["related"])
                })
            return records
