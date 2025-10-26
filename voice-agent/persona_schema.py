"""
Persona Data Structure Schema
Defines the data structure for user personas collected during onboarding
"""

from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class PersonaData:
    """Comprehensive persona data structure for content generation"""
    
    # Basic Demographics
    name: Optional[str] = None
    age_range: Optional[str] = None  # e.g., "18-25", "26-35", "36-50", "50+"
    location: Optional[str] = None
    
    # Interests and Passions
    interests: List[str] = field(default_factory=list)  # e.g., ["environment", "education", "animals"]
    causes: List[str] = field(default_factory=list)  # e.g., ["climate change", "homelessness"]
    
    # Availability and Capacity
    available_hours: Optional[str] = None  # e.g., "weekends", "evenings", "flexible"
    commitment_level: Optional[str] = None  # e.g., "casual", "moderate", "high"
    
    # Skills and Resources
    skills: List[str] = field(default_factory=list)  # e.g., ["teaching", "gardening", "mentoring"]
    languages: List[str] = field(default_factory=list)  # e.g., ["English", "Spanish"]
    
    # Goals and Motivation
    goals: List[str] = field(default_factory=list)  # e.g., ["career growth", "community impact", "skill building"]
    motivation: Optional[str] = None  # Why they want to use the app
    
    # Preferences
    preferred_activity_types: List[str] = field(default_factory=list)  # e.g., ["hands-on", "remote", "team-based"]
    time_preferences: List[str] = field(default_factory=list)  # e.g., ["morning", "afternoon", "evening"]
    
    # Past Experience
    volunteer_experience: Optional[str] = None  # "none", "some", "extensive"
    productivity_style: Optional[str] = None  # e.g., "structured", "flexible", "goal-oriented"
    
    def to_dict(self) -> dict:
        """Convert to dictionary for storage"""
        return {
            "name": self.name,
            "age_range": self.age_range,
            "location": self.location,
            "interests": self.interests,
            "causes": self.causes,
            "available_hours": self.available_hours,
            "commitment_level": self.commitment_level,
            "skills": self.skills,
            "languages": self.languages,
            "goals": self.goals,
            "motivation": self.motivation,
            "preferred_activity_types": self.preferred_activity_types,
            "time_preferences": self.time_preferences,
            "volunteer_experience": self.volunteer_experience,
            "productivity_style": self.productivity_style,
        }
    
    def to_context_string(self) -> str:
        """Convert to formatted string for Claude context"""
        parts = []
        
        if self.name:
            parts.append(f"Name: {self.name}")
        if self.age_range:
            parts.append(f"Age: {self.age_range}")
        if self.location:
            parts.append(f"Location: {self.location}")
        
        if self.interests:
            parts.append(f"Interests: {', '.join(self.interests)}")
        if self.causes:
            parts.append(f"Passionate about: {', '.join(self.causes)}")
        
        if self.available_hours:
            parts.append(f"Available: {self.available_hours}")
        if self.commitment_level:
            parts.append(f"Commitment: {self.commitment_level}")
        
        if self.skills:
            parts.append(f"Skills: {', '.join(self.skills)}")
        if self.languages:
            parts.append(f"Languages: {', '.join(self.languages)}")
        
        if self.goals:
            parts.append(f"Goals: {', '.join(self.goals)}")
        if self.motivation:
            parts.append(f"Motivation: {self.motivation}")
        
        if self.preferred_activity_types:
            parts.append(f"Prefers: {', '.join(self.preferred_activity_types)}")
        if self.time_preferences:
            parts.append(f"Times: {', '.join(self.time_preferences)}")
        
        if self.volunteer_experience:
            parts.append(f"Experience: {self.volunteer_experience}")
        if self.productivity_style:
            parts.append(f"Productivity style: {self.productivity_style}")
        
        return "\n".join(parts) if parts else "No persona data collected yet."

