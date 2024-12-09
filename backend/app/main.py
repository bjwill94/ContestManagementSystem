from fastapi import FastAPI, HTTPException, Depends, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from . import models, schemas, database
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, text
import logging

# Configure logging
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
models.Base.metadata.create_all(bind=database.engine)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Category endpoints
@app.post("/categories/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/categories/", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@app.get("/categories/{category_id}", response_model=schemas.Category)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.put("/categories/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category_update: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in category_update.dict().items():
        setattr(db_category, key, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category

@app.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}

# Event endpoints
@app.post("/events/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db)):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events/", response_model=List[schemas.Event])
def get_events(category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Event)
    if category_id:
        query = query.filter(models.Event.category_id == category_id)
    return query.all()

@app.get("/events/{event_id}", response_model=schemas.Event)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event_update: schemas.EventCreate, db: Session = Depends(get_db)):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in event_update.dict().items():
        setattr(db_event, key, value)
    
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # First, delete all results associated with this event
    db.query(models.Result).filter(models.Result.event_id == event_id).delete()
    
    # Then delete the event (this will automatically handle the participant_event associations)
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}

# Participant endpoints
@app.post("/participants/", response_model=schemas.Participant)
def create_participant(participant: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    # Check if chest number is unique
    existing = db.query(models.Participant).filter(models.Participant.chest_number == participant.chest_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Chest number already registered")
    
    # Validate category exists
    category = db.query(models.Category).filter(models.Category.id == participant.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Selected category does not exist")
    
    # Validate age against category
    if participant.age < category.min_age or participant.age > category.max_age:
        raise HTTPException(
            status_code=400,
            detail=f"Participant age {participant.age} is not within the allowed range ({category.min_age}-{category.max_age}) for category {category.name}"
        )
    
    # Create participant without events
    participant_data = participant.dict(exclude={'event_ids'})
    db_participant = models.Participant(**participant_data)
    
    # Add events
    events = db.query(models.Event).filter(models.Event.id.in_(participant.event_ids)).all()
    if len(events) != len(participant.event_ids):
        raise HTTPException(status_code=400, detail="One or more event IDs are invalid")
    
    # Validate events belong to selected category
    for event in events:
        if event.category_id != participant.category_id:
            raise HTTPException(
                status_code=400,
                detail=f"Event {event.name} does not belong to the selected category {category.name}"
            )
    
    db_participant.events = events
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant

@app.get("/participants/")
def get_participants(
    category_id: int = None,
    event_id: int = None,
    db: Session = Depends(get_db)
):
    try:
        # Start with base query including events relationship
        query = db.query(models.Participant).options(joinedload(models.Participant.events))
        
        # Add category filter if provided
        if category_id:
            query = query.filter(models.Participant.category_id == category_id)
        
        # Add event filter if provided
        if event_id:
            query = (
                query
                .join(models.participant_event)
                .filter(models.participant_event.c.event_id == event_id)
            )
        
        # Execute query and get all participants with their events
        participants = query.all()
        logger.info(f"Found {len(participants)} participants")
        
        # Convert to dictionary format
        result = []
        for participant in participants:
            participant_dict = {
                "id": participant.id,
                "name": participant.name,
                "age": participant.age,
                "sex": participant.sex,
                "chest_number": participant.chest_number,
                "church": participant.church,
                "district": participant.district,
                "region": participant.region,
                "state": participant.state,
                "category_id": participant.category_id,
                "events": [{
                    "id": event.id,
                    "name": event.name,
                    "category_id": event.category_id,
                    "date": event.date,
                    "venue": event.venue
                } for event in participant.events]
            }
            result.append(participant_dict)
        
        return result

    except Exception as e:
        logger.error(f"Error fetching participants: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching participants: {str(e)}"
        )

@app.get("/participants/{participant_id}", response_model=schemas.Participant)
def get_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    return participant

@app.put("/participants/{participant_id}", response_model=schemas.Participant)
def update_participant(participant_id: int, participant_update: schemas.ParticipantCreate, db: Session = Depends(get_db)):
    db_participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not db_participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Check if chest number is unique (excluding current participant)
    existing = db.query(models.Participant).filter(
        models.Participant.chest_number == participant_update.chest_number,
        models.Participant.id != participant_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Chest number already registered")
    
    # Validate category exists
    category = db.query(models.Category).filter(models.Category.id == participant_update.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Selected category does not exist")
    
    # Validate age against category
    if participant_update.age < category.min_age or participant_update.age > category.max_age:
        raise HTTPException(
            status_code=400,
            detail=f"Participant age {participant_update.age} is not within the allowed range ({category.min_age}-{category.max_age}) for category {category.name}"
        )
    
    # Update participant data
    participant_data = participant_update.dict(exclude={'event_ids'})
    for key, value in participant_data.items():
        setattr(db_participant, key, value)
    
    # Update events
    events = db.query(models.Event).filter(models.Event.id.in_(participant_update.event_ids)).all()
    if len(events) != len(participant_update.event_ids):
        raise HTTPException(status_code=400, detail="One or more event IDs are invalid")
    
    # Validate events belong to selected category
    for event in events:
        if event.category_id != participant_update.category_id:
            raise HTTPException(
                status_code=400,
                detail=f"Event {event.name} does not belong to the selected category {category.name}"
            )
    
    db_participant.events = events
    db.commit()
    db.refresh(db_participant)
    return db_participant

@app.delete("/participants/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    participant = db.query(models.Participant).filter(models.Participant.id == participant_id).first()
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Delete associated results first
    db.query(models.Result).filter(models.Result.participant_id == participant_id).delete()
    
    # Delete participant (this will automatically handle the participant_event associations)
    db.delete(participant)
    db.commit()
    return {"message": "Participant deleted successfully"}

# Result endpoints
@app.post("/results/")
def create_results(results: List[schemas.ResultCreate], db: Session = Depends(get_db)):
    try:
        # Create all results first
        db_results = []
        for result in results:
            # Calculate total marks
            total_marks = result.judge1_marks + result.judge2_marks + result.judge3_marks
            
            # Create new result
            db_result = models.Result(
                **result.dict(),
                total_marks=total_marks,
                rank=0  # Will be updated after saving all
            )
            db.add(db_result)
            db_results.append(db_result)
        
        db.commit()
        
        # Now update ranks for each event
        event_ids = set(result.event_id for result in results)
        for event_id in event_ids:
            event_results = (
                db.query(models.Result)
                .filter(models.Result.event_id == event_id)
                .order_by(models.Result.total_marks.desc())
                .all()
            )
            
            for rank, r in enumerate(event_results, 1):
                r.rank = rank
        
        db.commit()
        
        # Refresh all results
        for result in db_results:
            db.refresh(result)
        
        return {"message": "Results saved successfully", "count": len(db_results)}
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving results: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error saving results: {str(e)}"
        )

@app.get("/results/", response_model=List[schemas.ResultResponse])
def get_results(event_id: int = None, category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(
        models.Result,
        models.Participant.name.label('participant_name'),
        models.Participant.chest_number,
        models.Event.name.label('event_name'),
        models.Category.name.label('category_name')
    ).join(
        models.Participant
    ).join(
        models.Event
    ).join(
        models.Category
    )
    
    if event_id:
        query = query.filter(models.Result.event_id == event_id)
    elif category_id:
        query = query.filter(models.Event.category_id == category_id)
    
    results = query.all()
    
    return [{
        'id': result.Result.id,
        'participant_name': result.participant_name,
        'chest_number': result.chest_number,
        'event_name': result.event_name,
        'category_name': result.category_name,
        'judge1_marks': result.Result.judge1_marks,
        'judge2_marks': result.Result.judge2_marks,
        'judge3_marks': result.Result.judge3_marks,
        'total_marks': result.Result.total_marks,
        'rank': result.Result.rank
    } for result in results]

@app.get("/participants/by-category-event/{category_id}/{event_id}")
def get_participants_by_category_event(
    category_id: int,
    event_id: int,
    db: Session = Depends(get_db)
):
    print(f"Fetching participants for category {category_id} and event {event_id}")  # Debug log
    
    # First, let's get all participants in this category
    participants = (
        db.query(models.Participant)
        .filter(models.Participant.category_id == category_id)
        .all()
    )
    
    print(f"Found {len(participants)} participants in category")  # Debug log
    
    # Then filter for those who are registered for the event
    filtered_participants = []
    for participant in participants:
        event_ids = [event.id for event in participant.events]
        if event_id in event_ids:
            filtered_participants.append(participant)
    
    print(f"After event filtering: {len(filtered_participants)} participants")  # Debug log
    return filtered_participants

@app.get("/results/{participant_id}/{event_id}")
def get_result(
    participant_id: int,
    event_id: int,
    db: Session = Depends(get_db)
):
    result = (
        db.query(models.Result)
        .filter(
            models.Result.participant_id == participant_id,
            models.Result.event_id == event_id
        )
        .first()
    )
    return result

@app.post("/results/update")
def update_result(result: schemas.ParticipantResultCreate, db: Session = Depends(get_db)):
    db_result = (
        db.query(models.Result)
        .filter(
            models.Result.participant_id == result.participant_id,
            models.Result.event_id == result.event_id
        )
        .first()
    )
    
    if db_result:
        # Update existing result
        for key, value in result.dict().items():
            setattr(db_result, key, value)
    else:
        # Create new result
        db_result = models.Result(**result.dict())
        db.add(db_result)
    
    db.commit()
    db.refresh(db_result)
    return db_result

@app.get("/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        logger.info("Starting to fetch dashboard stats")
        
        # Get total counts
        total_categories = db.query(models.Category).count()
        logger.info(f"Total categories: {total_categories}")
        
        total_events = db.query(models.Event).count()
        logger.info(f"Total events: {total_events}")
        
        total_participants = db.query(models.Participant).count()
        logger.info(f"Total participants: {total_participants}")
        
        # Get completed events (events with results)
        try:
            completed_events = db.query(models.Result.event_id.distinct()).count()
        except Exception as e:
            logger.error(f"Error getting completed events: {str(e)}")
            completed_events = 0
        logger.info(f"Completed events: {completed_events}")
        
        # Get recent participants (last 5)
        try:
            recent_participants = (
                db.query(models.Participant)
                .options(joinedload(models.Participant.category))
                .options(joinedload(models.Participant.events))
                .order_by(models.Participant.id.desc())
                .limit(5)
                .all()
            )
        except Exception as e:
            logger.error(f"Error getting recent participants: {str(e)}")
            recent_participants = []
            
        # Get category stats
        try:
            category_stats = (
                db.query(
                    models.Category.name.label('category'),
                    func.count(models.Participant.id).label('participant_count')
                )
                .outerjoin(models.Participant)
                .group_by(models.Category.name)
                .all()
            )
        except Exception as e:
            logger.error(f"Error getting category stats: {str(e)}")
            category_stats = []
            
        # Get popular events
        try:
            popular_events = (
                db.query(
                    models.Event.name,
                    func.count(models.participant_event.c.participant_id).label('participant_count')
                )
                .outerjoin(models.participant_event)
                .group_by(models.Event.id, models.Event.name)
                .order_by(text('participant_count DESC'))
                .limit(6)
                .all()
            )
        except Exception as e:
            logger.error(f"Error getting popular events: {str(e)}")
            popular_events = []
        
        # Format recent participants data
        recent_participants_data = []
        for participant in recent_participants:
            try:
                events = [event.name for event in participant.events]
                recent_participants_data.append({
                    "id": participant.id,
                    "name": participant.name,
                    "chest_number": participant.chest_number,
                    "category": participant.category.name if participant.category else "No Category",
                    "events": events
                })
            except Exception as e:
                logger.error(f"Error formatting participant {participant.id}: {str(e)}")
        
        # Format category stats
        category_stats_data = [
            {"category": stat.category, "participant_count": stat.participant_count}
            for stat in category_stats
        ]
        
        # Format popular events
        popular_events_data = [
            {"name": event.name, "participant_count": event.participant_count}
            for event in popular_events
        ]
        
        response_data = {
            "total_categories": total_categories,
            "total_events": total_events,
            "total_participants": total_participants,
            "completed_events": completed_events,
            "recent_participants": recent_participants_data,
            "category_stats": category_stats_data,
            "popular_events": popular_events_data
        }
        
        logger.info("Successfully compiled dashboard stats")
        return response_data
        
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )
