"""
Seed script to create default demo accounts for testing all user roles:
1. Owner: Global access to all properties
2. Managers: One manager per property (Coorg, Ooty, Alleppey)
3. Staff: One staff member per property (Coorg, Ooty, Alleppey)
4. Demo Guest: Standard guest linked to a guest record
"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User, Guest, Property, UserRole


def seed_demo_accounts():
    db: Session = SessionLocal()
    print("=" * 60)
    print("KAVERI STAYS: Seeding Demo Accounts")
    print("=" * 60)

    try:
        # 1. Fetch properties
        properties = db.query(Property).all()
        if not properties:
            print("[ERROR] No properties found in database. Please ensure '05_schema_final.sql' & '06_migration.sql' are loaded.")
            return False

        prop_map = {p.name: p.property_id for p in properties}
        print(f"Found {len(properties)} properties: {list(prop_map.keys())}")

        default_password = "Password@123"
        pw_hash = get_password_hash(default_password)

        demo_users = [
            # Owner
            {
                "email": "owner@kaveristays.com",
                "full_name": "Kaveri Stays Executive Owner",
                "role": UserRole.owner,
                "property_id": None,
                "phone": "+919876543210"
            }
        ]

        # Add Managers and Staff for each property
        for p in properties:
            clean_name = p.name.lower().replace(" ", "_").replace("kaveri_", "")
            demo_users.extend([
                {
                    "email": f"manager.{clean_name}@kaveristays.com",
                    "full_name": f"Manager ({p.name})",
                    "role": UserRole.manager,
                    "property_id": p.property_id,
                    "phone": "+919876543211"
                },
                {
                    "email": f"staff.{clean_name}@kaveristays.com",
                    "full_name": f"Front Desk Staff ({p.name})",
                    "role": UserRole.staff,
                    "property_id": p.property_id,
                    "phone": "+919876543212"
                }
            ])

        # Add / Link Demo Guest
        demo_guest_email = "guest.demo@kaveristays.com"
        guest_record = db.query(Guest).filter(Guest.email == demo_guest_email).first()
        if not guest_record:
            guest_record = Guest(
                full_name="Demo Guest",
                email=demo_guest_email,
                phone="+919876543299",
                city="Bangalore"
            )
            db.add(guest_record)
            db.flush()

        demo_users.append({
            "email": demo_guest_email,
            "full_name": "Demo Guest User",
            "role": UserRole.guest,
            "property_id": None,
            "guest_id": guest_record.guest_id,
            "phone": "+919876543299"
        })

        created_count = 0
        for u_data in demo_users:
            email = u_data["email"].strip().lower()
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                new_u = User(
                    email=email,
                    password_hash=pw_hash,
                    role=u_data["role"],
                    property_id=u_data.get("property_id"),
                    guest_id=u_data.get("guest_id"),
                    full_name=u_data["full_name"],
                    phone=u_data.get("phone"),
                    is_active=True
                )
                db.add(new_u)
                created_count += 1
                print(f"  + Created: {email} [Role: {u_data['role'].value}]")
            else:
                print(f"  * Exists:  {email} [Role: {existing.role.value}]")

        db.commit()
        print("\n" + "=" * 60)
        print(f"[SUCCESS] Seeding complete! {created_count} demo user(s) created.")
        print(f"Default password for all demo accounts: {default_password}")
        print("=" * 60)
        return True

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Seeding failed: {e}", file=sys.stderr)
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = seed_demo_accounts()
    sys.exit(0 if success else 1)
