Number.prototype.pad = function(size) {
  var s = String(this);
  while(s.length < (size || 2)){
    s = "0" + s;
  }
  return s;
}

var gametypes = {
  5: 'Unranked',
  6: 'Quick Match',
  7: 'Hero League',
  8: 'Team League'
};

var recentReplaysList = document.getElementById('recent-replays-list');

var res = '';
for(var i=0, j=params.replays.length; i<j; i++){
  var p = params.replays[i];
  var GameLength = Math.floor(p.GameLength / (16 * 60)) + ':' + (Math.round(p.GameLength / 16) % 60).pad(2);
  var TimePlayed = Math.floor((Date.now() - p.TimePlayed) / (1000 * 60 * 60 * 24));
  TimePlayed = TimePlayed === 0 ? 'Today' : TimePlayed + ' Day' + (TimePlayed > 1 ? 's' : '') + ' Ago';
  var Result = p.WinningTeam === p.Players[0].Team ? 'Victory' : 'Defeat';
  res += '<div class="row ' + Result + '">';
  res += '<div class="item replayBuild">' + p.Build + '</div>';
  res += '<div class="item replayGameType">' + gametypes[p.GameType] + '</div>';
  res += '<div class="item replayResult">' + Result + '</div>';
  res += '<div class="item replayMapName">' + p.MapName + '</div>';
  res += '<div class="item replayHero">' + p.Players[0].Hero + '</div>';
  res += '<div class="item replayGameLength">' + GameLength + '</div>';
  res += '<div class="item replayTimePlayed">' + TimePlayed + '</div>';
  res += '</div>';
}
recentReplaysList.innerHTML = res;
