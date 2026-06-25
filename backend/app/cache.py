"""
Small in-memory LRU result cache for compare requests.

Monte Carlo comparisons are deterministic for a given (state, actions,
n_rollouts) because the rollout seed is derived from the state. Caching keeps
repeated requests (e.g. a user toggling back and forth in the UI) instant.
"""

from __future__ import annotations

import hashlib
import json
from collections import OrderedDict
from typing import Any, Optional


class ResultCache:
    def __init__(self, capacity: int = 256) -> None:
        self.capacity = capacity
        self._store: "OrderedDict[str, Any]" = OrderedDict()
        self.hits = 0
        self.misses = 0

    @staticmethod
    def key(payload: dict) -> str:
        blob = json.dumps(payload, sort_keys=True, default=str)
        return hashlib.sha256(blob.encode("utf-8")).hexdigest()

    def get(self, key: str) -> Optional[Any]:
        if key in self._store:
            self._store.move_to_end(key)
            self.hits += 1
            return self._store[key]
        self.misses += 1
        return None

    def set(self, key: str, value: Any) -> None:
        self._store[key] = value
        self._store.move_to_end(key)
        while len(self._store) > self.capacity:
            self._store.popitem(last=False)

    def clear(self) -> None:
        self._store.clear()


cache = ResultCache()
