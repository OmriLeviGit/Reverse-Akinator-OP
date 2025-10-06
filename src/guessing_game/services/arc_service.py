# server/services/arc_service.py
from guessing_game.config.database import get_db_session
from guessing_game.models.db_arc import DBArc
from guessing_game.schemas.arc_schemas import Arc

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
                query = session.query(DBArc)
                if arc.chapter is not None:
                    query = query.filter(DBArc.last_chapter <= arc.chapter)
                if arc.episode is not None:
                    query = query.filter(DBArc.last_episode <= arc.episode)
                arc_list = query.all()
            return [db_arc.to_pydantic() for db_arc in arc_list]

    def get_forbidden_arcs(self, global_arc_limit: Arc) -> list[Arc]:
        """Get arcs that come after the global arc limit (forbidden/spoiler arcs)"""
        arcs_until = self.get_arcs_until(global_arc_limit)
        all_arcs = self.get_all_arcs()
        allowed_arc_names = {arc.name for arc in arcs_until}
        
        # Return forbidden arcs as objects (arcs that come after the limit)
        return [arc for arc in all_arcs if arc.name not in allowed_arc_names]