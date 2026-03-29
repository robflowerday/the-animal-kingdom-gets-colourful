from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import hashlib
import colorsys
import webcolors
import random
from typing import Optional
from animals import ANIMALS

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


class WordRequest(BaseModel):
    word: str


class NameRequest(BaseModel):
    name: str


class ColorResponse(BaseModel):
    hex: str
    rgb: list[int]
    hsl: list[float]
    name: Optional[str]
    is_named_color: bool
    word: str
    reasoning: str


class AnimalResponse(BaseModel):
    name: str
    scientific_name: str
    hex: str
    why: str
    origin: str
    habitat: str
    speed: str
    colours: str
    weight: str
    gender: str
    facts: list[str]
    animal_id: str


# ---------------------------------------------------------------------------
# Poetry banks — keyed by hue bucket, each list has dark / mid / light rows
# Each row is a list of sentences to pick from at random.
# ---------------------------------------------------------------------------

_HUE_POETRY: list[dict] = [
    # reds (0–20, wrapped 340–360)
    {
        "range": (0, 20),
        "dark":  [
            "The heat of a struck match held a moment too long.",
            "Something urgent pressed against the inside of a closed fist.",
            "A bruised fruit split open on a hot, still afternoon.",
            "The last syllable of an argument that ended a room.",
        ],
        "mid":   [
            "The particular insistence of a wound that has not yet decided to heal.",
            "A poppy opening in a field that didn't ask to be beautiful.",
            "The colour of wanting something you have already been told you cannot have.",
            "Like biting your cheek by accident and tasting the surprise of it.",
        ],
        "light": [
            "The blush that rises before a word is even spoken.",
            "Something tender and embarrassed and entirely alive.",
            "The inside of a peach held up to a window on a summer morning.",
            "A flamingo standing in shallow water, indifferent to how lovely it looks.",
        ],
    },
    # orange / amber (20–45)
    {
        "range": (20, 45),
        "dark":  [
            "A slow ember deciding whether to become flame.",
            "Candlelight through amber glass in a room no one visits.",
            "The smell of autumn compressed into a colour — dry leaves and the edge of cold.",
            "A lantern left swinging in a corridor after the last person has gone.",
        ],
        "mid":   [
            "The last warmth of October light falling across an empty table.",
            "Something generous and unhurried, like bread left to cool on a windowsill.",
            "The colour of a voice that always knows when to stop talking.",
            "A fox crossing a field just before the mist closes in behind it.",
        ],
        "light": [
            "Marmalade on toast in a quiet kitchen before the day has asked anything of you.",
            "The first hour of a long journey, still optimistic.",
            "Citrus peel turned inside out, bright and unexpectedly sharp.",
            "A warm afternoon refusing to admit it will ever end.",
        ],
    },
    # yellow (45–70)
    {
        "range": (45, 70),
        "dark":  [
            "Pollen suspended in a shaft of late afternoon light that has started to thicken.",
            "A fever dream on the far side of the worst of it.",
            "Mustard fields seen from a train window, too fast to hold.",
            "The colour of a question you are not sure you want answered.",
        ],
        "mid":   [
            "Sunlight pressing through closed eyelids on the first warm day of the year.",
            "Something that refuses to be subtle about being alive.",
            "A wasp moving slowly across warm stone, entirely absorbed in its own concerns.",
            "The colour of a Tuesday morning that turns out to be extraordinary.",
        ],
        "light": [
            "Lemon curd in a jar by a window, almost too bright to look at.",
            "The particular cheerfulness of a thing that has not yet learned pessimism.",
            "Buttercup held under a chin, light catching the place it meets skin.",
            "A canary singing in a shaft of sun, oblivious to everything outside that column of gold.",
        ],
    },
    # yellow-green (70–90)
    {
        "range": (70, 90),
        "dark":  [
            "Something growing in a crack it was not invited into.",
            "Lichen on a north-facing stone, patient and unmoved for a hundred years.",
            "The light in a forest before your eyes have adjusted to its particular grammar.",
            "A colour that has decided to survive, one way or another.",
        ],
        "mid":   [
            "The first uncertain days of spring, neither quite alive nor quite still sleeping.",
            "A feeling of becoming, not yet arrived.",
            "Unripe fruit holding its sweetness in reserve.",
            "The colour of a plan that might just work if the weather holds.",
        ],
        "light": [
            "New leaves before they have learned to be properly green.",
            "The light through a glass of water on a white tablecloth.",
            "Something fresh and slightly sharp and full of intention.",
            "The moment just after rain when everything is still deciding what to do next.",
        ],
    },
    # green (90–150)
    {
        "range": (90, 150),
        "dark":  [
            "The coolness just beneath the surface of deep grass in high summer.",
            "Moss on stone that has not been asked to hurry.",
            "A forest floor after rain, alive with a smell that has no name.",
            "The colour of patience — the long, slow kind.",
        ],
        "mid":   [
            "The moment a forest exhales after three days of rain.",
            "Everything that grows without being told to.",
            "The colour of having enough, for now.",
            "Ferns uncurling in a wood that does not know it is being watched.",
        ],
        "light": [
            "The freshness of a cucumber split open in a summer kitchen.",
            "Mint growing wild at the edge of a garden that has long since stopped being tended.",
            "The colour of a deep breath taken outside after a long meeting.",
            "Something crisp and uncomplicated and glad to be here.",
        ],
    },
    # teal / cyan (150–195)
    {
        "range": (150, 195),
        "dark":  [
            "The light inside a glacier — blue and ancient and entirely indifferent.",
            "Mineral silence at the bottom of a very clear, very cold pool.",
            "Something old and patient and entirely without hurry.",
            "The deep end of a fjord on a grey afternoon.",
        ],
        "mid":   [
            "Sea-glass worn smooth by years of quiet, uncomplaining persistence.",
            "The particular calm of deep water seen from a cliff's edge.",
            "A swimming pool at dawn, before anyone has broken the surface.",
            "The colour of a thought you cannot quite finish but keep returning to.",
        ],
        "light": [
            "The shallow edge of a tropical sea over white sand.",
            "A bathroom tile from 1972, inexplicably still beautiful.",
            "The inside of a wave just before it decides to fall.",
            "Something clear and cool and slightly surprising, like finding a spring in a field.",
        ],
    },
    # blue (195–255)
    {
        "range": (195, 255),
        "dark":  [
            "Deep water remembering a sky it can no longer reach.",
            "The colour of longing for something you cannot quite name.",
            "The weight of a winter evening settling into the streets.",
            "An ocean that has swallowed whole centuries and is in no hurry to give them back.",
        ],
        "mid":   [
            "The distance between two mountains on a very clear day.",
            "The feeling of looking at the sky and finding, briefly, that you have no words for it.",
            "An early morning in winter before anyone has spoken.",
            "The colour of a letter that took three weeks to arrive.",
        ],
        "light": [
            "The sky in the hour before noon in a country you have never been to.",
            "Forget-me-nots pressed into a book found in a house clearance.",
            "Something open and unhurried and quietly optimistic.",
            "The blue of a clear day that asks nothing of you.",
        ],
    },
    # indigo / violet (255–290)
    {
        "range": (255, 290),
        "dark":  [
            "The last colour the sky holds before it surrenders to dark.",
            "Ink spreading in still water — deliberate and irreversible.",
            "The weight of dusk settling into the hollows of an old city.",
            "Something between sleeping and dreaming, committed to neither.",
        ],
        "mid":   [
            "A bruise fading, carrying its memory in gradients.",
            "The colour of a feeling that arrived before its explanation.",
            "Wisteria at the edge of a wall in the rain, heavy and still.",
            "The hour after sunset when purple briefly claims the whole horizon.",
        ],
        "light": [
            "Lavender drying in a jar on a sill, its smell outlasting everything.",
            "The softest part of a bruise, three days on.",
            "Something ceremonial and slightly drowsy.",
            "A lilac tree in full bloom outside a window that is almost always closed.",
        ],
    },
    # purple / magenta (290–340)
    {
        "range": (290, 340),
        "dark":  [
            "Velvet worn thin at the elbows of a coat kept far too long.",
            "The ceremony of something ordinary treated as if it were sacred.",
            "A bruised petal pressed between the pages of a book never finished.",
            "The colour of a feeling too complicated to explain at a party.",
        ],
        "mid":   [
            "An orchid kept alive in a room that receives very little direct sun.",
            "Something between grief and theatre — committed to both.",
            "Bougainvillea falling over a wall in a heat too thick to move through.",
            "A plum left on a table until it has become philosophical about its own ripeness.",
        ],
        "light": [
            "Rose quartz left on a windowsill, quietly absorbing a winter afternoon.",
            "Something flushed and a little overdressed and entirely delightful.",
            "The colour of a secret told to someone you have only just met.",
            "Candy floss dissolving on a tongue before you can quite decide if you wanted it.",
        ],
    },
]


def _hue_bucket(h: float) -> dict:
    """Return the poetry bucket for a given hue angle (0–360)."""
    # Wrap reds that go above 340 back into the first bucket
    h_adj = h if h <= 340 else h - 360
    for bucket in _HUE_POETRY:
        lo, hi = bucket["range"]
        if lo <= h_adj < hi:
            return bucket
    # Fallback: closest bucket
    return _HUE_POETRY[0]


def poetic_reasoning(word: str, hex_color: str, hsl: list[float], is_named: bool) -> str:
    h, s, l = hsl
    rng = random.Random(hex_color)  # deterministic: same colour → same poem

    bucket = _hue_bucket(h)

    if l < 42:
        pool = bucket["dark"]
    elif l > 58:
        pool = bucket["light"]
    else:
        pool = bucket["mid"]

    return rng.choice(pool)


# ---------------------------------------------------------------------------
# Colour utilities
# ---------------------------------------------------------------------------

def hsl_to_rgb(h: float, s: float, l: float) -> list[int]:
    """h: 0-360, s: 0-100, l: 0-100 → [r, g, b] 0-255"""
    r, g, b = colorsys.hls_to_rgb(h / 360, l / 100, s / 100)
    return [round(r * 255), round(g * 255), round(b * 255)]


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02X}{g:02X}{b:02X}"


def word_to_hsl(word: str) -> tuple[float, float, float]:
    """Deterministic, vivid color from any word using SHA-256."""
    digest = hashlib.sha256(word.lower().encode()).hexdigest()
    hue = int(digest[:4], 16) / 65535 * 360        # 0–360
    saturation = 55 + (int(digest[4:6], 16) / 255) * 40  # 55–95 %
    lightness = 38 + (int(digest[6:8], 16) / 255) * 22   # 38–60 %
    return hue, saturation, lightness


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@app.post("/api/color", response_model=ColorResponse)
def get_word_color(request: WordRequest):
    word = request.word.strip()

    if not word:
        return ColorResponse(
            hex="#808080", rgb=[128, 128, 128], hsl=[0.0, 0.0, 50.0],
            name="gray", is_named_color=True, word=word,
            reasoning="The silence before a word is chosen — a grey, patient waiting.",
        )

    # Try exact CSS named color match
    try:
        hex_color = webcolors.name_to_hex(word.lower())
        rgb = webcolors.hex_to_rgb(hex_color)
        r, g, b = rgb.red, rgb.green, rgb.blue
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        hsl = [round(h * 360, 1), round(s * 100, 1), round(l * 100, 1)]
        return ColorResponse(
            hex=hex_color.upper(),
            rgb=[r, g, b],
            hsl=hsl,
            name=word.lower(),
            is_named_color=True,
            word=word,
            reasoning=poetic_reasoning(word, hex_color.upper(), hsl, is_named=True),
        )
    except (ValueError, AttributeError):
        pass

    # Generate deterministic color from word
    hue, sat, light = word_to_hsl(word)
    rgb = hsl_to_rgb(hue, sat, light)
    r, g, b = rgb
    hex_color = rgb_to_hex(r, g, b)
    hsl = [round(hue, 1), round(sat, 1), round(light, 1)]
    return ColorResponse(
        hex=hex_color,
        rgb=rgb,
        hsl=hsl,
        name=None,
        is_named_color=False,
        word=word,
        reasoning=poetic_reasoning(word, hex_color, hsl, is_named=False),
    )


@app.post("/api/animal", response_model=AnimalResponse)
def get_animal(request: NameRequest):
    name = request.name.lower().strip()
    idx = int(hashlib.sha256(name.encode()).hexdigest()[:8], 16) % len(ANIMALS)
    animal = ANIMALS[idx]
    return AnimalResponse(
        name=animal["name"],
        scientific_name=animal["scientific_name"],
        hex=animal["hex"],
        why=animal["why"],
        origin=animal["origin"],
        habitat=animal["habitat"],
        speed=animal["speed"],
        colours=animal["colours"],
        weight=animal["weight"],
        gender=animal["gender"],
        facts=animal["facts"],
        animal_id=animal["id"],
    )
