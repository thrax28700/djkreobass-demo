#!/usr/bin/env python3
"""
DJ KREOBASS — Gestionnaire de données
Gère les mixes, événements et réservations du portfolio.
Usage : python data_manager.py [commande]
"""

import json
import os
import sys
from datetime import datetime, date
from pathlib import Path

BASE_DIR  = Path(__file__).resolve().parent.parent
DATA_FILE = BASE_DIR / "data" / "data.json"
LOG_FILE  = BASE_DIR / "data" / "reservations.json"


def load_data(filepath: Path) -> dict:
    if not filepath.exists():
        print(f"[ERREUR] Fichier introuvable : {filepath}")
        sys.exit(1)
    with open(filepath, encoding="utf-8") as f:
        return json.load(f)


def save_data(filepath: Path, data: dict) -> None:
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] Données sauvegardées → {filepath}")


def list_mixes():
    data = load_data(DATA_FILE)
    mixes = data.get("mixes", [])
    print(f"\n{'='*55}")
    print(f"  DJ KREOBASS — {len(mixes)} Mix(es)")
    print(f"{'='*55}")
    for i, m in enumerate(mixes, 1):
        print(f"  {i:>2}. [{m['year']}] {m['title']:<30} {m['duration']}")
        print(f"       Genre: {m['genre']}")
    print()


def list_events():
    data   = load_data(DATA_FILE)
    events = data.get("events", [])
    upcoming = [e for e in events if e["status"] == "upcoming"]
    past     = [e for e in events if e["status"] == "past"]

    print(f"\n{'='*55}")
    print(f"  DJ KREOBASS — Événements ({len(upcoming)} à venir, {len(past)} passés)")
    print(f"{'='*55}")
    print("\n  À VENIR :")
    for e in upcoming:
        print(f"    📅 {e['date']:<14} | {e['venue']:<25} | {e['city']}")
    print("\n  PASSÉS :")
    for e in past:
        print(f"    ✔  {e['date']:<14} | {e['venue']:<25} | {e['city']}")
    print()


def add_event():
    print("\n  Ajouter un événement")
    print("  " + "-"*30)
    venue  = input("  Nom du lieu       : ").strip()
    city   = input("  Ville             : ").strip()
    d_str  = input("  Date (JJ Mmm AAAA): ").strip()
    time   = input("  Heure (HH:MM)     : ").strip()
    status = input("  Statut [upcoming/past] : ").strip().lower()

    if status not in ("upcoming", "past"):
        status = "upcoming"

    new_event = {
        "date":       d_str,
        "venue":      venue,
        "city":       city,
        "time":       time,
        "status":     status,
        "ticket_url": None,
    }

    data = load_data(DATA_FILE)
    data["events"].append(new_event)
    save_data(DATA_FILE, data)
    print(f"  [OK] Événement '{venue}' ajouté.")


def add_mix():
    print("\n  Ajouter un mix")
    print("  " + "-"*30)
    title    = input("  Titre         : ").strip()
    genre    = input("  Genre         : ").strip()
    duration = input("  Durée (H:MM:SS ou MM:SS) : ").strip()
    year     = input(f"  Année [{date.today().year}] : ").strip() or str(date.today().year)
    sc_url   = input("  SoundCloud URL [#] : ").strip() or "#"
    desc     = input("  Description   : ").strip()

    new_mix = {
        "title":         title,
        "duration":      duration,
        "genre":         genre,
        "year":          year,
        "soundcloud_url": sc_url,
        "description":   desc,
    }

    data = load_data(DATA_FILE)
    data["mixes"].append(new_mix)
    save_data(DATA_FILE, data)
    print(f"  [OK] Mix '{title}' ajouté.")


def show_reservations():
    if not LOG_FILE.exists():
        print("\n  Aucune réservation enregistrée.")
        return

    reservations = load_data(LOG_FILE)
    if not isinstance(reservations, list):
        reservations = []

    print(f"\n{'='*55}")
    print(f"  Réservations ({len(reservations)} au total)")
    print(f"{'='*55}")
    for i, r in enumerate(reservations, 1):
        print(f"\n  [{i}] {r.get('date', '?')}")
        print(f"      Nom     : {r.get('name', '?')}")
        print(f"      Email   : {r.get('email', '?')}")
        print(f"      Type    : {r.get('event_type', '?')}")
        print(f"      D.souh. : {r.get('event_date', '?')}")
        print(f"      Message : {r.get('message', '')[:80]}…")
    print()


def export_events_csv():
    data   = load_data(DATA_FILE)
    events = data.get("events", [])
    out    = BASE_DIR / "data" / "events_export.csv"
    with open(out, "w", encoding="utf-8") as f:
        f.write("Date,Venue,Ville,Heure,Statut\n")
        for e in events:
            f.write(f'"{e["date"]}","{e["venue"]}","{e["city"]}","{e["time"]}","{e["status"]}"\n')
    print(f"  [OK] Export CSV → {out}")


def stats():
    data  = load_data(DATA_FILE)
    mixes = data.get("mixes", [])
    evts  = data.get("events", [])
    total_dur = 0
    for m in mixes:
        parts = m["duration"].split(":")
        if len(parts) == 3:
            total_dur += int(parts[0])*3600 + int(parts[1])*60 + int(parts[2])
        elif len(parts) == 2:
            total_dur += int(parts[0])*60 + int(parts[1])
    h, rem = divmod(total_dur, 3600)
    mn, _  = divmod(rem, 60)

    print(f"\n  Statistiques DJ KREOBASS")
    print(f"  {'─'*35}")
    print(f"  Mixes totaux      : {len(mixes)}")
    print(f"  Durée totale      : {h}h {mn:02d}min")
    print(f"  Événements        : {len(evts)} ({sum(1 for e in evts if e['status']=='upcoming')} à venir)")
    genres = {}
    for m in mixes:
        genres[m["genre"]] = genres.get(m["genre"], 0) + 1
    print(f"  Genres couverts   : {', '.join(genres.keys())}")
    print()


COMMANDS = {
    "mixes":        list_mixes,
    "events":       list_events,
    "add-event":    add_event,
    "add-mix":      add_mix,
    "reservations": show_reservations,
    "export-csv":   export_events_csv,
    "stats":        stats,
}


def main():
    print("\n  ╔══════════════════════════════╗")
    print("  ║   DJ KREOBASS Data Manager   ║")
    print("  ║   Centre-Val de Loire        ║")
    print("  ╚══════════════════════════════╝")

    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        fn  = COMMANDS.get(cmd)
        if fn:
            fn()
        else:
            print(f"\n  [ERREUR] Commande inconnue : '{cmd}'")
            _usage()
        return

    _usage()
    choice = input("\n  Votre choix : ").strip().lower()
    fn = COMMANDS.get(choice)
    if fn:
        fn()
    else:
        print(f"  Commande '{choice}' non reconnue.")


def _usage():
    print("\n  Commandes disponibles :")
    for cmd, fn in COMMANDS.items():
        doc = fn.__doc__ or fn.__name__
        print(f"    {cmd:<18} — {doc.strip().split(chr(10))[0]}")
    print()


if __name__ == "__main__":
    main()
