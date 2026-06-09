from pydantic import BaseModel
from typing import Optional


class RoundOverride(BaseModel):
    preMoney: float
    capital: float
    esopPercent: float
    esopAllocatedPercent: float
