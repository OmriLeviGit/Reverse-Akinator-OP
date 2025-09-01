#!/usr/bin/env python3
"""
Bootstrap Orchestrator Tool

WORKFLOW:
1. Phase 1 - Preparation: 
   - Build character CSV
   - Initialize databases (SQL + Vector)
   - Optionally discover sections/statistics (interactive prompt with guidance)

2. Phase 2 - Character Processing:
   - Process characters in a unified pipeline
   - Extract all data simultaneously per character
   - Store in databases, download avatars, create thumbnails

USAGE:
    python bootstrap_orchestrator.py --phase=1                # Phase 1: setup and optional discovery
    python bootstrap_orchestrator.py --phase=2 --limit=10     # Phase 2: process 10 characters for testing
    python bootstrap_orchestrator.py --status                 # Show current bootstrap status

RESUMING:
    python bootstrap_orchestrator.py --phase=2 --start-from="Monkey_D._Luffy"
"""

import sys
import argparse
import time
from pathlib import Path

# Add project root directory to path so 'guessing_game' can be imported as a package
project_root = Path(__file__).parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Phase 1 imports
from .phase1_preparation.build_character_csv import scrape_character_data
from .phase1_preparation.database_builder import DatabaseBuilder 
from .phase1_preparation.section_and_table_discovery import discover_sections

# Phase 2 imports
from .phase2_processing.character_processor import CharacterProcessor

class BootstrapOrchestrator:
    """Main orchestrator for the bootstrap pipeline"""
    
    def __init__(self):
        self.start_time = time.time()
    
    def run_phase1_preparation(self, skip_csv=False):
        """
        Run Phase 1: Preparation
        
        Args:
            skip_csv (bool): Skip CSV generation (if already exists)
        """
        phase1_start = time.time()
        print("=" * 80)
        print("PHASE 1: PREPARATION")
        print("=" * 80)
        
        try:
            # Step 1: Build character CSV (if needed)
            if not skip_csv:
                print("\nStep 1: Building character CSV from One Piece wiki...")
                scrape_character_data()
                print("[SUCCESS] Character CSV created successfully")
            else:
                print("\nStep 1: Skipping CSV generation (already exists)")
            
            # Step 2: Initialize databases
            print("\nStep 2: Initializing databases...")
            db_builder = DatabaseBuilder()
            db_builder.reset_database()  # This now includes vector DB initialization
            print("[SUCCESS] Databases initialized successfully")
            
            # Step 3: Interactive discovery prompt
            self._ask_discovery_choice()
            
            phase1_duration = time.time() - phase1_start
            print(f"\n[SUCCESS] Phase 1 completed successfully in {phase1_duration:.2f} seconds!")
            print("You can now run Phase 2 with: --phase=2")
            
        except Exception as e:
            phase1_duration = time.time() - phase1_start
            print(f"\n[FAILED] Phase 1 failed after {phase1_duration:.2f} seconds: {e}")
            raise
    
    def run_phase2_processing(self, limit=None, start_from=None):
        """
        Run Phase 2: Unified Character Processing
        
        Args:
            limit (int): Limit number of characters for testing
            start_from (str): Character ID to resume from
        """
        # First, confirm settings are updated
        self._confirm_settings_updated()
        
        if limit:
            print(f"[TEST MODE] Processing only {limit} characters")
        if start_from:
            print(f"[RESUME MODE] Starting from character '{start_from}'")
        
        return self._run_phase2_core(limit, start_from)
    
    def _run_phase2_core(self, limit, start_from):
        """
        Core Phase 2 processing logic
        """
        phase2_start = time.time()
        try:
            # Create character processor
            processor = CharacterProcessor(
                delay_between_characters=1.0,  # Be respectful to the wiki
                delay_between_requests=0.1
            )
            
            # Process characters
            results = processor.process_all_characters(
                start_from=start_from,
                limit=limit
            )
            
            if results.get('success', True):
                phase2_duration = time.time() - phase2_start
                print(f"\n[SUCCESS] Phase 2 completed successfully in {phase2_duration:.2f} seconds!")
                
                # Show summary
                stats = results.get('stats', {})
                print(f"\nSUMMARY:")
                print(f"  Characters processed: {stats.get('total_processed', 0)}")
                print(f"  Success rate: {stats.get('successful', 0)}/{stats.get('total_processed', 0)}")
                print(f"  Avatars downloaded: {stats.get('avatars_downloaded', 0)}")
                print(f"  Descriptions generated: {stats.get('descriptions_generated', 0)}")
                print(f"  Total duration: {phase2_duration:.2f} seconds")
                
                # Suggest next step
                if limit:
                    print(f"\n[TEST] Test completed. For full processing: run without --limit")
                
            else:
                phase2_duration = time.time() - phase2_start
                print(f"\n[FAILED] Phase 2 failed after {phase2_duration:.2f} seconds: {results.get('error')}")
                return False
                
        except KeyboardInterrupt:
            phase2_duration = time.time() - phase2_start
            print(f"\n\n[STOPPED] Phase 2 interrupted by user after {phase2_duration:.2f} seconds")
            if not limit:  # Only show resume tip for full runs
                print("[TIP] You can resume by running with: --phase=2 --start-from=<last_processed_character>")
            return False
        except Exception as e:
            phase2_duration = time.time() - phase2_start
            print(f"\n[FAILED] Phase 2 failed after {phase2_duration:.2f} seconds: {e}")
            raise
        
        return True
    
    def _ask_discovery_choice(self):
        """Ask user whether to run section discovery"""
        print("\nStep 3: Section Discovery")
        print("=" * 50)
        print("Section discovery analyzes wiki pages to find available data sections and table entries.")
        print("Desirable sections and table entries are needed to be configured in WHITELISTED_SECTIONS and WHITELISTED_STATISTICS in scripts/bootstrap_tools/bootstrap_settings.py")
        print("")
        print("IMPORTANT:")
        print("- If you haven't discovered the sections and updated bootstrap_settings.py yet → Choose YES, and after discovery manually update the desirable settings before moving to phase 2")
        print("- If you have already updated the scripts/bootstrap_tools/bootstrap_settings.py → Choose NO to continue to phase 2")
        print("=" * 50)
        
        while True:
            choice = input("\nRun section discovery? [y/N]: ").strip().lower()
            if choice in ['', 'n', 'no']:
                print("\nSkipping section discovery (settings assumed to be configured)")
                print("\nStarting Phase 2: Character Processing...")
                self._run_phase2_core(None, None)
                break
            elif choice in ['y', 'yes']:
                print("\nRunning section discovery...")
                discover_sections()
                print("[SUCCESS] Section discovery completed")
                
                print("\n" + "!" * 80)
                print("NEXT STEPS REQUIRED:")
                print("1. Check the discovery results output")
                print("2. Update scripts/bootstrap_tools/bootstrap_settings.py:")
                print("   - Add relevant sections to WHITELISTED_SECTIONS")
                print("   - Add relevant statistics to WHITELISTED_STATISTICS")
                print("3. Rerun Phase 1 and choose 'N' for discovery")
                print("4. Then run Phase 2 with: --phase=2")
                print("!" * 80)
                print("\n[STOPPED] Phase 1 stopped for settings configuration")
                raise SystemExit(0)  # Clean exit
            else:
                print("Please enter 'y' for yes or 'n' for no")
    
    def _confirm_settings_updated(self):
        """Confirm that user has updated settings.py before Phase 2"""
        print("=" * 80)
        print("PHASE 2: CHARACTER PROCESSING - SETTINGS CHECK")
        print("=" * 80)
        print("")
        print("Before processing characters, please confirm that you have updated")
        print("the WHITELISTED_SECTIONS and WHITELISTED_STATISTICS in scripts/bootstrap_tools/bootstrap_settings.py")
        print("")
        print("Options:")
        print("  1. Yes, I have updated the settings → Continue with Phase 2")
        print("  2. No, I need to run Phase 1 first → Exit and run Phase 1")
        print("")
        
        while True:
            choice = input("Please choose [1/2]: ").strip()
            if choice == '1':
                print("\n[CONTINUE] Proceeding with character processing...")
                return True
            elif choice == '2':
                print("\n[INFO] Please run Phase 1 first to configure settings:")
                print("python scripts/bootstrap_tools/bootstrap_orchestrator.py --phase=1")
                print("\nThen return here and run Phase 2.")
                raise SystemExit(0)  # Clean exit
            else:
                print("Please enter '1' or '2'")
    
# Small avatars are created during Phase 2 character processing

    def get_status_report(self):
        """Get a status report of the current state"""
        print("=" * 80)
        print("BOOTSTRAP STATUS REPORT")
        print("=" * 80)
        
        # Check CSV file
        from .bootstrap_settings import CHARACTER_CSV_PATH
        csv_exists = CHARACTER_CSV_PATH.exists()
        print(f"Character CSV: {'[EXISTS]' if csv_exists else '[MISSING]'}")
        
        # Check database
        try:
            from guessing_game.config.database import get_db_session
            from guessing_game.models.db_character import DBCharacter
            
            with get_db_session() as session:
                char_count = session.query(DBCharacter).count()
                print(f"SQL Database: [OK] {char_count} characters")
        except Exception:
            print("SQL Database: [ERROR] or EMPTY")
        
        # Check vector database
        try:
            from guessing_game.config.vector_db import initialize_collection
            client, collection, model = initialize_collection()
            # Note: ChromaDB count might not be easily accessible depending on version
            print(f"Vector Database: [OK] CONNECTED ({collection.name})")
        except Exception:
            print("Vector Database: [ERROR]")
        
        # Check avatars
        from .bootstrap_settings import LARGE_AVATARS_DIR, SMALL_AVATARS_DIR
        large_count = len(list(LARGE_AVATARS_DIR.glob("*.webp"))) if LARGE_AVATARS_DIR.exists() else 0
        small_count = len(list(SMALL_AVATARS_DIR.glob("*.webp"))) if SMALL_AVATARS_DIR.exists() else 0
        
        print(f"Large Avatars: {large_count} files")
        print(f"Small Avatars: {small_count} files")
        
        # Check discovery file
        from .bootstrap_settings import DISCOVERY_PATH
        discovery_exists = DISCOVERY_PATH.exists() if hasattr(Path, 'exists') else False
        print(f"Discovery Results: {'[EXISTS]' if discovery_exists else '[MISSING]'}")
        
        print("=" * 80)


def main():
    """Main CLI entry point"""
    
    parser = argparse.ArgumentParser(
        description="Bootstrap Orchestrator Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    # Main action arguments
    parser.add_argument('--phase', type=int, choices=[1, 2], 
                       help='Run specific phase (1=preparation, 2=processing)')
    parser.add_argument('--status', action='store_true',
                       help='Show current bootstrap status')
    
    # Phase 1 options
    parser.add_argument('--skip-csv', action='store_true',
                       help='Skip CSV generation (Phase 1)')
    
    # Phase 2 options
    parser.add_argument('--limit', type=int,
                       help='Limit number of characters to process (Phase 2)')
    parser.add_argument('--start-from', type=str,
                       help='Character ID to resume from (Phase 2)')
    
    args = parser.parse_args()
    
    # Create orchestrator
    orchestrator = BootstrapOrchestrator()
    
    try:
        if args.status:
            orchestrator.get_status_report()
        
        elif args.phase == 1:
            orchestrator.run_phase1_preparation(
                skip_csv=args.skip_csv
            )
        
        elif args.phase == 2:
            orchestrator.run_phase2_processing(
                limit=args.limit,
                start_from=args.start_from
            )
        
        else:
            parser.print_help()
            print(f"\nPHASE DESCRIPTIONS:")
            print(f"=" * 50)
            print(f"Phase 1 - Preparation:")
            print(f"  • Builds character CSV from One Piece wiki")
            print(f"  • Resets and initializes databases (SQL + Vector)")
            print(f"  • Optionally discovers wiki sections for settings configuration")
            print(f"")
            print(f"Phase 2 - Character Processing:")
            print(f"  • Scrapes character data from wiki pages")
            print(f"  • Stores data in databases with vector embeddings")
            print(f"  • Downloads and processes character avatars")
            print(f"  • Generates AI descriptions and fun facts")
            print(f"")
            print(f"Quick start:")
            print(f"  Phase 1 (Setup):     python scripts/bootstrap_tools/bootstrap_orchestrator.py --phase=1")
            print(f"  Phase 2 (Process):   python scripts/bootstrap_tools/bootstrap_orchestrator.py --phase=2 --limit=5")
            print(f"  Check Status:        python scripts/bootstrap_tools/bootstrap_orchestrator.py --status")
    
    except KeyboardInterrupt:
        print(f"\n\n[STOPPED] Bootstrap interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n[FAILED] Bootstrap failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()