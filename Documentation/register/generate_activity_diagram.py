"""
generate_activity_diagram.py
Draws the Activity Diagram for the User Registration flow and saves it as
ActivityDiagram_Register.png in the same directory.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch

fig, ax = plt.subplots(figsize=(9, 18))
ax.set_xlim(0, 9)
ax.set_ylim(0, 18)
ax.axis('off')
fig.patch.set_facecolor('#FAFAFA')

# ── colour palette ────────────────────────────────────────────────────────────
C_START   = '#2C3E50'   # dark navy  – start/end circle
C_ACTION  = '#2980B9'   # blue       – action rectangle
C_DECISION= '#F39C12'   # amber      – diamond decision
C_TERM    = '#27AE60'   # green      – terminal state
C_FE      = '#8E44AD'   # purple     – frontend swimlane label
C_BE      = '#16A085'   # teal       – backend swimlane label
C_ARROW   = '#555555'   # dark grey  – arrows
C_LABEL   = '#FFFFFF'   # white      – text inside shapes
C_NOTE    = '#E74C3C'   # red        – error labels

# ── helper functions ──────────────────────────────────────────────────────────
def draw_rounded_rect(ax, cx, cy, w, h, color, text, fontsize=9):
    rect = mpatches.FancyBboxPatch(
        (cx - w/2, cy - h/2), w, h,
        boxstyle="round,pad=0.1", linewidth=1.2,
        edgecolor='#CCCCCC', facecolor=color, zorder=3)
    ax.add_patch(rect)
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fontsize,
            color=C_LABEL, fontweight='bold', zorder=4,
            wrap=True, multialignment='center')

def draw_diamond(ax, cx, cy, w, h, color, text, fontsize=8.5):
    xs = [cx, cx+w/2, cx, cx-w/2, cx]
    ys = [cy+h/2, cy, cy-h/2, cy, cy+h/2]
    ax.fill(xs, ys, color=color, zorder=3)
    ax.plot(xs, ys, color='#CCCCCC', linewidth=1.2, zorder=4)
    ax.text(cx, cy, text, ha='center', va='center', fontsize=fontsize,
            color=C_LABEL, fontweight='bold', zorder=5, multialignment='center')

def arrow(ax, x1, y1, x2, y2, label='', label_side='right'):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=C_ARROW, lw=1.4), zorder=2)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        offset = 0.25 if label_side == 'right' else -0.25
        ax.text(mx + offset, my, label, ha='center', va='center',
                fontsize=8, color=C_NOTE, fontweight='bold')

def draw_circle(ax, cx, cy, r, color):
    circle = plt.Circle((cx, cy), r, color=color, zorder=5)
    ax.add_patch(circle)

def draw_double_circle(ax, cx, cy, r, color):
    outer = plt.Circle((cx, cy), r,      color=color,     zorder=5)
    inner = plt.Circle((cx, cy), r*0.55, color='#FAFAFA', zorder=6)
    ax.add_patch(outer)
    ax.add_patch(inner)

# ── title ─────────────────────────────────────────────────────────────────────
ax.text(4.5, 17.6, 'Activity Diagram — User Registration',
        ha='center', va='center', fontsize=13, fontweight='bold', color='#2C3E50')
ax.text(4.5, 17.25, 'Course 960121 Web Technology',
        ha='center', va='center', fontsize=9, color='#777777')

# ── swimlane backgrounds ──────────────────────────────────────────────────────
ax.axvspan(0.1, 4.5, ymin=0.02, ymax=0.94, alpha=0.06, color='#8E44AD')
ax.axvspan(4.5, 8.9, ymin=0.02, ymax=0.94, alpha=0.06, color='#16A085')
ax.text(2.3, 16.8, 'Frontend (Browser)', ha='center', fontsize=10,
        color=C_FE, fontweight='bold')
ax.text(6.7, 16.8, 'Backend (Express)', ha='center', fontsize=10,
        color=C_BE, fontweight='bold')
ax.axvline(x=4.5, ymin=0.02, ymax=0.95, color='#CCCCCC', linewidth=1, linestyle='--')

# ── layout positions (y-coordinate, from top to bottom) ──────────────────────
y = {
    'start':     16.3,
    'fill_form': 15.5,
    'fe_valid':  14.4,
    'show_err':  13.4,
    'post_api':  12.5,
    'be_email':  11.4,
    'ret_409':   10.4,
    'show_409':   9.5,
    'hash_pw':    9.5,
    'save_db':    8.5,
    'ret_201':    7.5,
    'redirect':   6.5,
    'end':        5.6,
}
CX_FE = 2.3   # frontend centre-x
CX_BE = 6.7   # backend centre-x

# ── shapes ────────────────────────────────────────────────────────────────────
draw_circle(ax, CX_FE, y['start'], 0.3, C_START)
ax.text(CX_FE + 0.5, y['start'], 'Start', va='center', fontsize=9, color='#555')

draw_rounded_rect(ax, CX_FE, y['fill_form'], 3.2, 0.55, C_ACTION,
                  'User fills Registration Form\n(name, email, password)')

draw_diamond(ax, CX_FE, y['fe_valid'], 3.0, 0.75, C_DECISION,
             'Frontend validates\npassword rules?')

draw_rounded_rect(ax, CX_FE, y['show_err'], 2.8, 0.55, C_NOTE,
                  'Show validation error\n(back to form)')

draw_rounded_rect(ax, CX_FE, y['post_api'], 3.2, 0.55, C_ACTION,
                  'POST /api/register\n{ name, email, password }')

draw_diamond(ax, CX_BE, y['be_email'], 3.0, 0.75, C_DECISION,
             'Email already\nexists in DB?')

draw_rounded_rect(ax, CX_BE, y['ret_409'], 2.8, 0.55, C_NOTE,
                  'Return 409 Conflict')

draw_rounded_rect(ax, CX_FE, y['show_409'], 2.8, 0.55, C_NOTE,
                  'Show "Email already registered"')

draw_rounded_rect(ax, CX_BE, y['hash_pw'], 2.8, 0.55, C_TERM,
                  'Hash password\n(bcrypt, 10 rounds)')

draw_rounded_rect(ax, CX_BE, y['save_db'], 2.8, 0.55, C_TERM,
                  'Save user to auth_user.json\n{ id, name, email, hash, date }')

draw_rounded_rect(ax, CX_BE, y['ret_201'], 2.8, 0.55, C_TERM,
                  'Return 201 Created\n{ message, user }')

draw_rounded_rect(ax, CX_FE, y['redirect'], 2.8, 0.55, C_ACTION,
                  'Redirect to Login page')

draw_double_circle(ax, CX_FE, y['end'], 0.3, C_START)
ax.text(CX_FE + 0.5, y['end'], 'End', va='center', fontsize=9, color='#555')

# ── arrows — main happy path ──────────────────────────────────────────────────
arrow(ax, CX_FE, y['start']    - 0.30, CX_FE, y['fill_form'] + 0.28)
arrow(ax, CX_FE, y['fill_form']- 0.28, CX_FE, y['fe_valid']  + 0.38)
arrow(ax, CX_FE, y['fe_valid'] - 0.38, CX_FE, y['post_api']  + 0.28,  label='Valid', label_side='right')
# FE → BE cross-lane for POST
arrow(ax, CX_FE + 1.6, y['post_api'], CX_BE - 1.5, y['be_email'] + 0.38)
arrow(ax, CX_BE, y['be_email'] - 0.38, CX_BE, y['hash_pw']  + 0.28,   label='No', label_side='right')
arrow(ax, CX_BE, y['hash_pw']  - 0.28, CX_BE, y['save_db']  + 0.28)
arrow(ax, CX_BE, y['save_db']  - 0.28, CX_BE, y['ret_201']  + 0.28)
# BE → FE cross-lane for 201 response
arrow(ax, CX_BE - 1.5, y['ret_201'], CX_FE + 1.5, y['redirect'] + 0.28)
arrow(ax, CX_FE, y['redirect'] - 0.28, CX_FE, y['end'] + 0.30)

# ── arrows — error paths ──────────────────────────────────────────────────────
# FE validation error path (loops back up)
arrow(ax, CX_FE - 1.5, y['fe_valid'], CX_FE - 1.5, y['show_err'] + 0.28, label='Invalid', label_side='left')
arrow(ax, CX_FE, y['show_err'] - 0.28, CX_FE - 2.0, y['show_err'] - 0.28)
# loop back arrow drawn as an L-shape
ax.annotate('', xy=(CX_FE - 2.0, y['fill_form']),
            xytext=(CX_FE - 2.0, y['show_err'] - 0.28),
            arrowprops=dict(arrowstyle='->', color=C_ARROW, lw=1.4))
ax.annotate('', xy=(CX_FE - 1.6, y['fill_form']),
            xytext=(CX_FE - 2.0, y['fill_form']),
            arrowprops=dict(arrowstyle='->', color=C_ARROW, lw=1.4))

# BE 409 path
arrow(ax, CX_BE + 1.5, y['be_email'], CX_BE + 1.5, y['ret_409'] + 0.28, label='Yes', label_side='right')
arrow(ax, CX_BE, y['ret_409'] - 0.28, CX_BE - 2.0, y['ret_409'] - 0.28)
# cross to FE
ax.annotate('', xy=(CX_FE + 1.5, y['show_409']),
            xytext=(CX_BE - 2.0, y['show_409']),
            arrowprops=dict(arrowstyle='->', color=C_ARROW, lw=1.4))

# ── legend ────────────────────────────────────────────────────────────────────
legend_x, legend_y = 0.15, 4.8
ax.text(legend_x, legend_y, 'Legend:', fontsize=8.5, fontweight='bold', color='#444')
for color, label in [(C_ACTION, 'Action'), (C_DECISION, 'Decision'),
                     (C_TERM, 'Success step'), (C_NOTE, 'Error step')]:
    legend_y -= 0.45
    patch = mpatches.FancyBboxPatch((legend_x, legend_y - 0.15), 0.5, 0.3,
                                     boxstyle='round,pad=0.05',
                                     facecolor=color, edgecolor='none')
    ax.add_patch(patch)
    ax.text(legend_x + 0.65, legend_y, label, fontsize=8, va='center', color='#444')

# ── save ──────────────────────────────────────────────────────────────────────
import os
out_path = os.path.join(os.path.dirname(__file__), 'ActivityDiagram_Register.png')
plt.savefig(out_path, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
print(f'Saved: {out_path}')
