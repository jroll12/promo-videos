#!/bin/sh
# 16:9 (1920x1080) version = the finished 9:16 render, unchanged, scaled to full height and centred,
# with the sides filled by its own green background (edge columns stretched and blurred so it blends in).
# usage: tools/pillarbox_16x9.sh zogreo-promo-9x16.mp4 out-16x9.mp4
set -e
ffmpeg -y -loglevel error -i "$1" -filter_complex "
[0:v]scale=-2:1080:flags=lanczos,split=3[c][l0][r0];
[l0]crop=2:1080:0:0,scale=656:1080:flags=neighbor,boxblur=60:3[l];
[r0]crop=2:1080:in_w-2:0,scale=656:1080:flags=neighbor,boxblur=60:3[r];
[l][c][r]hstack=inputs=3,format=yuv420p[v]" \
 -map "[v]" -map 0:a -c:v libx264 -crf 14 -preset slow -r 30 -c:a copy -movflags +faststart "$2"
