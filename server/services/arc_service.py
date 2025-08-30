# server/services/arc_service.py
from server.config.database import get_db_session
from server.models.db_arc import DBArc
from server.schemas.arc_schemas import Arc

class ArcService:
    def get_arc_by_name(self, arc_name: str) -> Arc:
        if arc_name == "All":
            return Arc(name="All", chapter=None, episode=None)

        with get_db_session() as session:
            db_arc = session.query(DBArc).filter(DBArc.name == arc_name).first()
            return db_arc.to_pydantic()

    def get_all_arcs(self) -> list[Arc]:
        with get_db_session() as session:
            arc_list = session.query(DBArc).order_by(DBArc.last_chapter, DBArc.last_episode).all()
            return [db_arc.to_pydantic() for db_arc in arc_list]

    def get_arcs_until(self, arc: Arc) -> list[Arc]:
        with get_db_session() as session:
            if arc.name == "All":
                arc_list = session.query(DBArc).all()
            else:
                arc_list = session.query(DBArc).filter(
                    DBArc.last_chapter <= arc.chapter,
                    DBArc.last_episode <= arc.episode
                ).all()
            return [db_arc.to_pydantic() for db_arc in arc_list]