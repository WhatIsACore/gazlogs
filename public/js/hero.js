'use strict';

var hero = heroByAttr(params.Hero);

var portrait = document.getElementById('hero-portrait');
var heroTitle = document.getElementById('hero-title');
var gametype = document.getElementById('gametype');
var build = document.getElementById('build');
var buildList = document.getElementById('build-list');
var updated = document.getElementById('updated');
var winrate = document.getElementById('winrate');
var pickrate = document.getElementById('pickrate');
var banrate = document.getElementById('banrate');
var heroDetails = document.getElementById('hero-details');

portrait.innerHTML = '<img src="/img/heroportraits/' + hero.toLowerCase() + '.png">';
heroTitle.innerHTML = altNames[hero].PrimaryName + '<span class="subgroup">(' + altNames[hero].Group + ')</span>';

var buildListHTML = '';
for(var i = 0, j = 8; i < j; i++){
  var b = params.BuildList[i];
  if(b != null){
    buildListHTML += '<div class="item build" data-build=' + b + '>';
    buildListHTML += (i === 0 ? '(Latest) ' : '') + 'Build ' + b;
    buildListHTML += '</div>';
  }
}
buildList.innerHTML = buildListHTML;

var nav = document.getElementsByClassName('nav-button');
var navTargets = document.getElementsByClassName('hero-details-target');
for(var i in nav)
  if(nav[i].children) nav[i].addEventListener('click', function(){
    for(var i in nav) if(nav[i].children) nav[i].className = 'nav-button';
    for(var i in navTargets) if(navTargets[i].children) navTargets[i].className = 'hero-details-target';
    this.className = 'nav-button selected';
    document.getElementById(this.dataset.target).className = 'hero-details-target selected';
  });

var gametypeSelect = document.getElementsByClassName('gametype');
var buildSelect = document.getElementsByClassName('build');
for(var i in gametypeSelect)
  if(gametypeSelect[i].children) gametypeSelect[i].addEventListener('click', function(){
    params.GameType = this.dataset.gametype;
    heroDetails.className = heroDetails.className.replace(' complete', '');
    queryStatistics();
  });
for(var i in buildSelect)
  if(buildSelect[i].children) buildSelect[i].addEventListener('click', function(){
    params.Build = this.dataset.build;
    heroDetails.className = heroDetails.className.replace(' complete', '');
    queryStatistics();
  });

function queryStatistics(){
  gametype.innerHTML = fullGameTypes[params.GameType];
  build.innerHTML = params.Build;

  var req = new XMLHttpRequest();
  req.onreadystatechange = function(){
    if(req.readyState == XMLHttpRequest.DONE){
      showStatistics(JSON.parse(req.responseText));
    }
  }
  req.open('GET', '/api/statistics/hero/' + hero + '?gametype=' + params.GameType + '&build=' + params.Build, true);
  req.send();
}

queryStatistics();

var filters = [
  'Mastery',
  'HeroicAbility',
  'CombatStyle',
  'GenericTalent',
  'Talent'
]
function formatTalent(name){
  name = name.replace(hero, '');
  for(var i = 0, j = filters.length; i < j; i++)
    name = name.replace(filters[i], '');
  var res = '';
  for(var i = 0, j = name.length; i < j; i++)
    res += (name.charCodeAt(i) < 97 ? ' ' : '') + name[i];
  return res;
}

function showStatistics(statRes){

  heroDetails.className += ' complete';
  updated.innerHTML = getTimeSince(statRes.Time) + ' ago';

  var p = statRes.Heroes[0];

  var PickRate = p.GamesPicked === 0 ? 'no data' : (p.GamesPicked / statRes.SampleSize * 100).toFixed(1) + '%';
  var BanRate = p.GamesBanned === 0 ? 'no data' : (p.GamesBanned / statRes.SampleSize * 100).toFixed(1) + '%';
  var WinRate = p.GamesPicked === 0 ? 'no data' : (p.Wins / (p.Wins + p.Losses) * 100).toFixed(1) + '%';

  winrate.innerHTML = WinRate;
  pickrate.innerHTML = PickRate;
  banrate.innerHTML = BanRate;

  for(var i = 0; i < 7; i++){
    var res = '';
    var size = 0;
    for(var j = 0, k = p.Talents[i].length; j < k; j++)
      size += p.Talents[i][j].Wins + p.Talents[i][j].Losses;

    for(var j = 0, k = p.Talents[i].length; j < k; j++){
      var s = p.Talents[i][j];
      var talentPopularity = ((s.Wins + s.Losses) / size * 100).toFixed(1) + '%';
      var talentWinRate = ((s.Wins) / (s.Wins + s.Losses) * 100).toFixed(1) + '%';

      res += '<div class="talent">';
      res += '<div class="name">' + formatTalent(s.Name) + '</div>';
      res += '<div class="popularity stat"><span class="tlabel">Popularity</span><span class="value">' + talentPopularity + '</span></div>';
      res += '<div class="winrate stat"><span class="tlabel">Winrate</span><span class="value">' + talentWinRate + '</span></div>';
      res += '</div>';
    }
    document.getElementById('tier' + (i + 1)).innerHTML = res;
  }

}
