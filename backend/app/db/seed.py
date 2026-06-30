from app.db.database import SessionLocal, engine, Base
from app.db.models import User, Shelter, Report, Alert
from app.auth import get_password_hash
from datetime import datetime, timedelta

def seed_database():
    print("Database Seeding: Initializing...")
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database already has users
        if db.query(User).first():
            print("Database Seeding: Data already exists, skipping.")
            return
            
        print("Database Seeding: Adding initial mock data for Pakistan...")
        
        # 1. Add Users
        admin = User(
            email="admin@ndma.gov.pk",
            password_hash=get_password_hash("admin123"),
            full_name="NDMA Operations Director",
            role="admin",
            phone_number="03001234567"
        )
        rescue = User(
            email="rescue@rescue.gov.pk",
            password_hash=get_password_hash("rescue123"),
            full_name="Rescue 1122 Coordinator",
            role="rescue_team",
            phone_number="03111234567"
        )
        citizen = User(
            email="citizen@citizen.com",
            password_hash=get_password_hash("citizen123"),
            full_name="Mohammad Ali",
            role="citizen",
            phone_number="03331234567"
        )
        
        db.add_all([admin, rescue, citizen])
        db.commit()
        db.refresh(admin)
        db.refresh(rescue)
        db.refresh(citizen)
        
        # 2. Add Shelters
        shelter1 = Shelter(
            name="Nowshera Government Degree College Shelter",
            latitude=34.0150,
            longitude=71.9720,
            capacity=500,
            current_occupancy=120,
            status="open",
            contact_number="0923-920101"
        )
        shelter2 = Shelter(
            name="Muzaffargarh Emergency Relief Camp",
            latitude=30.0710,
            longitude=71.1890,
            capacity=1000,
            current_occupancy=450,
            status="open",
            contact_number="066-9200256"
        )
        shelter3 = Shelter(
            name="Badin Sports Complex Relief Hub",
            latitude=24.6560,
            longitude=68.8370,
            capacity=350,
            current_occupancy=350,
            status="full",
            contact_number="0297-920013"
        )
        shelter4 = Shelter(
            name="Quetta Cantonment Safe Camp",
            latitude=30.1790,
            longitude=66.9750,
            capacity=600,
            current_occupancy=50,
            status="open",
            contact_number="081-9201115"
        )
        
        db.add_all([shelter1, shelter2, shelter3, shelter4])
        
        # 3. Add Crowdsourced Incident Reports
        report1 = Report(
            citizen_id=citizen.id,
            latitude=34.0200,
            longitude=71.9800,
            description="Kabul River water level rose above warning marker, entering low-lying houses in Nowshera Kalan.",
            severity="critical",
            status="verified",
            verified_by=admin.id
        )
        report2 = Report(
            citizen_id=citizen.id,
            latitude=30.1250,
            longitude=71.1210,
            description="Farming fields flooded near Chenab riverbank. Livestock requires immediate evacuation.",
            severity="high",
            status="pending"
        )
        report3 = Report(
            citizen_id=citizen.id,
            latitude=24.6620,
            longitude=68.8410,
            description="Water logging in Badin city blocks. Drainage lines are completely choked.",
            severity="medium",
            status="resolved",
            verified_by=rescue.id
        )
        
        db.add_all([report1, report2, report3])
        
        # 4. Add Active Flood Alerts
        alert1 = Alert(
            title="Kabul River High Flood Warning",
            message="Extreme river volumes flowing downstream from Kabul River. Nowshera district low-lying zones must evacuate.",
            risk_level="red",
            latitude=34.0150,
            longitude=71.9720,
            radius_km=15.0,
            expires_at=datetime.utcnow() + timedelta(days=2)
        )
        alert2 = Alert(
            title="Monsoon Urban Flooding Badin Alert",
            message="Torrential rainfall forecasted in coastal Sindh. Localized urban flooding likely in Badin and neighboring towns.",
            risk_level="orange",
            latitude=24.6560,
            longitude=68.8370,
            radius_km=25.0,
            expires_at=datetime.utcnow() + timedelta(days=1)
        )
        
        db.add_all([alert1, alert2])
        db.commit()
        
        print("Database Seeding: Completed successfully!")
    except Exception as e:
        print(f"Database Seeding: Error encountered: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
