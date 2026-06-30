from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.db.database import get_db
from app.db.models import Report, User, RescueTask
from app.schemas import ReportCreate, ReportVerify, ReportResponse
from app.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/reports", tags=["Incident Reports"])

@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(report_in: ReportCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_report = Report(
        citizen_id=current_user.id,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        description=report_in.description,
        severity=report_in.severity,
        image_url=report_in.image_url,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # Return user details in response
    new_report.citizen_name = current_user.full_name
    return new_report

@router.get("/", response_model=List[ReportResponse])
def list_reports(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Report).options(
        joinedload(Report.citizen),
        joinedload(Report.rescue_task).joinedload(RescueTask.assigned_team)
    )
    
    if status_filter:
        query = query.filter(Report.status == status_filter)
        
    reports = query.order_by(Report.created_at.desc()).all()
    
    # Map raw queries for formatting citizen name safely
    for r in reports:
        r.citizen_name = r.citizen.full_name if r.citizen else "Anonymous Citizen"
        if r.rescue_task:
            r.rescue_task.assigned_team_name = r.rescue_task.assigned_team.full_name if r.rescue_task.assigned_team else None
            
    return reports

@router.patch("/{id}/verify", response_model=ReportResponse)
def verify_report(
    id: str,
    verify_in: ReportVerify,
    current_user: User = Depends(RoleChecker(["admin", "rescue_team"])),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
        
    report.status = verify_in.status
    report.verified_by = current_user.id
    
    # If the report is verified and a team is assigned, create/update the RescueTask
    if verify_in.status == "verified" and verify_in.assign_team_id:
        # Check if user exists and is a rescue team
        team_member = db.query(User).filter(User.id == verify_in.assign_team_id, User.role == "rescue_team").first()
        if not team_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned ID must belong to a valid rescue team member."
            )
            
        task = db.query(RescueTask).filter(RescueTask.report_id == id).first()
        if not task:
            task = RescueTask(
                report_id=id,
                assigned_team_id=verify_in.assign_team_id,
                status="assigned",
                notes=f"Dispatched by {current_user.full_name} for immediate relief."
            )
            db.add(task)
        else:
            task.assigned_team_id = verify_in.assign_team_id
            task.status = "assigned"
            
    elif verify_in.status == "resolved":
        task = db.query(RescueTask).filter(RescueTask.report_id == id).first()
        if task:
            task.status = "completed"
            
    db.commit()
    db.refresh(report)
    
    # Populate fields for serialization
    report.citizen_name = report.citizen.full_name if report.citizen else "Anonymous Citizen"
    if report.rescue_task:
        # Ensure latest load
        db.refresh(report.rescue_task)
        report.rescue_task.assigned_team_name = report.rescue_task.assigned_team.full_name if report.rescue_task.assigned_team else None
        
    return report
