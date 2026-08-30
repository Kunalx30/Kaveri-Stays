"""
Standalone Database Connection and Schema Verification Script for Kaveri Stays.
Tests connection to PostgreSQL 'kaveri_stays' database and inspects existing and auth tables.
"""
import sys
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models import (
    Property, RoomType, Room, RatePlan, Guest, Booking, Payment, Review,
    User, RefreshToken, PaymentIdempotency
)


def verify_database():
    print("=" * 60)
    print("KAVERI STAYS: PostgreSQL Database Verification")
    print("=" * 60)
    
    try:
        with engine.connect() as conn:
            # 1. Test basic connectivity
            result = conn.execute(text("SELECT current_database(), version();")).fetchone()
            db_name, version = result[0], result[1]
            print(f"[OK] Connected to database: {db_name}")
            print(f"[OK] PostgreSQL Version: {version.split()[0]} {version.split()[1]}")
            
            # 2. Check btree_gist extension
            ext = conn.execute(text("SELECT extname FROM pg_extension WHERE extname = 'btree_gist';")).fetchone()
            if ext:
                print(f"[OK] Extension 'btree_gist' is ENABLED")
            else:
                print(f"[WARN] Extension 'btree_gist' is NOT installed.")

            # 3. Check existing tables and row counts
            print("\n--- Inspecting Core Hotel Tables ---")
            core_tables = [
                ("properties", Property),
                ("room_types", RoomType),
                ("rooms", Room),
                ("rate_plans", RatePlan),
                ("guests", Guest),
                ("bookings", Booking),
                ("payments", Payment),
                ("reviews", Review)
            ]
            
            db = SessionLocal()
            try:
                for table_name, model in core_tables:
                    count = db.query(model).count()
                    print(f"  * {table_name:15} : {count:6} records")
            finally:
                db.close()

            # 4. Check auth extension tables
            print("\n--- Inspecting Auth & Extension Tables ---")
            auth_tables = [
                ("users", User),
                ("refresh_tokens", RefreshToken),
                ("payment_idempotency", PaymentIdempotency)
            ]
            
            db = SessionLocal()
            try:
                for table_name, model in auth_tables:
                    count = db.query(model).count()
                    print(f"  * {table_name:20} : {count:6} records")
            finally:
                db.close()
                
            print("\n" + "=" * 60)
            print("[SUCCESS] All SQLAlchemy models and database tables verified successfully!")
            print("=" * 60)
            return True

    except Exception as e:
        print(f"\n[ERROR] Database connection failed: {e}", file=sys.stderr)
        print("\nPlease ensure:", file=sys.stderr)
        print("  1. PostgreSQL service is running.", file=sys.stderr)
        print("  2. Database 'kaveri_stays' exists and is populated.", file=sys.stderr)
        print("  3. '09_auth_schema.sql' has been applied.", file=sys.stderr)
        print("  4. backend/.env contains the correct DATABASE_URL with your password.", file=sys.stderr)
        return False


if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)
