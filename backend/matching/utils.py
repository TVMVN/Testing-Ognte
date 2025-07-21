def calculate_match_score(match_obj):
    total_score = (
        0.25 * int(match_obj.focus_area_match) +
        0.30 * match_obj.skill_match_score +
        0.15 * int(match_obj.degree_match) +
        0.10 * int(match_obj.location_match) +
        0.10 * int(match_obj.duration_match) +
        0.10 * int(match_obj.has_resume)
    )
    match_obj.total_score = round(total_score, 4)
    match_obj.save()
    return match_obj
