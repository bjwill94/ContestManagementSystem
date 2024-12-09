from pydantic import BaseModel
from typing import List, Optional

class CategoryBase(BaseModel):
    name: str
    min_age: int
    max_age: int
    description: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

class EventBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    date: str
    venue: str

class EventCreate(EventBase):
    category_id: int

class Event(EventBase):
    id: int
    category: Optional[Category] = None
    
    class Config:
        from_attributes = True

class ParticipantBase(BaseModel):
    name: str
    age: int
    sex: str
    chest_number: str
    church: str
    district: str
    region: str
    state: str
    category_id: Optional[int] = None

class ParticipantCreate(ParticipantBase):
    event_ids: List[int]
    category_id: int

class Participant(ParticipantBase):
    id: int
    events: List[Event] = []
    category: Optional[Category] = None
    
    class Config:
        from_attributes = True

class ResultBase(BaseModel):
    participant_id: int
    event_id: int
    judge1_marks: float
    judge2_marks: float
    judge3_marks: float

class ResultCreate(BaseModel):
    participant_id: int
    event_id: int
    judge1_marks: float
    judge2_marks: float
    judge3_marks: float
    total_marks: float
    rank: int

    class Config:
        orm_mode = True

class Result(ResultBase):
    id: int
    total_marks: float
    rank: int
    
    class Config:
        from_attributes = True

class ResultResponse(BaseModel):
    id: int
    participant_name: str
    chest_number: str
    event_name: str
    category_name: str
    judge1_marks: float
    judge2_marks: float
    judge3_marks: float
    total_marks: float
    rank: int

class ParticipantResult(BaseModel):
    participant_id: int
    event_id: int
    mark1: Optional[float] = None
    mark2: Optional[float] = None
    mark3: Optional[float] = None
    total_marks: Optional[float] = None
    rank: Optional[int] = None

    class Config:
        orm_mode = True

class ParticipantResultCreate(ParticipantResult):
    pass

class ParticipantResultUpdate(ParticipantResult):
    pass
