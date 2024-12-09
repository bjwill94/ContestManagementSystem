from sqlalchemy import Column, Integer, String, ForeignKey, Float, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Association table for many-to-many relationship between participants and events
participant_event = Table(
    'participant_event',
    Base.metadata,
    Column('participant_id', Integer, ForeignKey('participants.id')),
    Column('event_id', Integer, ForeignKey('events.id'))
)

class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    min_age = Column(Integer)
    max_age = Column(Integer)
    description = Column(String)

    events = relationship("Event", back_populates="category")
    participants = relationship("Participant", back_populates="category")

class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category_id = Column(Integer, ForeignKey('categories.id'))
    date = Column(String)
    venue = Column(String)

    category = relationship("Category", back_populates="events")
    participants = relationship("Participant", secondary=participant_event, back_populates="events")
    results = relationship("Result", back_populates="event")

class Participant(Base):
    __tablename__ = 'participants'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    sex = Column(String)
    chest_number = Column(String, unique=True, index=True)
    church = Column(String)
    district = Column(String)
    region = Column(String)
    state = Column(String)
    category_id = Column(Integer, ForeignKey('categories.id'))

    category = relationship("Category", back_populates="participants")
    events = relationship("Event", secondary=participant_event, back_populates="participants")
    results = relationship("Result", back_populates="participant")

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    participant_id = Column(Integer, ForeignKey("participants.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    judge1_marks = Column(Float, nullable=True)
    judge2_marks = Column(Float, nullable=True)
    judge3_marks = Column(Float, nullable=True)
    total_marks = Column(Float, nullable=True)
    rank = Column(Integer, nullable=True)

    participant = relationship("Participant", back_populates="results")
    event = relationship("Event", back_populates="results")
