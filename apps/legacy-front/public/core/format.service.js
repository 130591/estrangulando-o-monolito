(function () {
  'use strict'

  angular.module('devNotesApp').factory('format', formatFactory)

  // Lightness e chroma fixos, so o hue varia: e o que mantem todas as pills com
  // o mesmo peso visual no escuro.
  var TAG_L = 0.78
  var TAG_C = 0.12

  formatFactory.$inject = []
  function formatFactory() {
    return {
      dateLabel: dateLabel,
      monthLabel: monthLabel,
      tagStyle: tagStyle,
      tagOptionStyle: tagOptionStyle,
      visibilityLabel: visibilityLabel,
      countLabel: countLabel
    }

    function dateLabel(iso) {
      if (!iso) return ''

      var date = new Date(iso)
      if (isNaN(date.getTime())) return ''

      var days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000)

      if (days <= 0) return 'hoje'
      if (days === 1) return 'ontem'

      var label = date.getDate() + ' ' + shortMonth(date)
      if (date.getFullYear() !== new Date().getFullYear()) {
        label += ' ' + String(date.getFullYear()).slice(2)
      }
      return label
    }

    function monthLabel(iso) {
      if (!iso) return ''
      var date = new Date(iso)
      if (isNaN(date.getTime())) return ''
      return shortMonth(date) + ' ' + date.getFullYear()
    }

    // Intl devolve "ago." em pt-BR: o ponto sai para casar com o design.
    function shortMonth(date) {
      try {
        return date
          .toLocaleDateString('pt-BR', { month: 'short' })
          .replace('.', '')
          .toLowerCase()
      } catch (err) {
        return String(date.getMonth() + 1)
      }
    }

    function startOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    }

    // O hue vem gravado na tag, entao os dois fronts pintam identico.
    function tagStyle(tag) {
      if (!tag) return {}
      return {
        color: oklch(tag.hue, 1),
        background: oklch(tag.hue, 0.12)
      }
    }

    function tagOptionStyle(tag, selected) {
      if (!selected) return {}
      return {
        color: oklch(tag.hue, 1),
        background: oklch(tag.hue, 0.12),
        'border-color': oklch(tag.hue, 0.35)
      }
    }

    function oklch(hue, alpha) {
      var base = TAG_L + ' ' + TAG_C + ' ' + (hue || 250)
      return alpha >= 1 ? 'oklch(' + base + ')' : 'oklch(' + base + ' / ' + alpha + ')'
    }

    function visibilityLabel(visibility) {
      return visibility === 'private' ? 'privado' : 'público'
    }

    function countLabel(stats) {
      if (!stats) return ''
      return stats.total + ' ' + plural(stats.total, 'nota', 'notas') +
        ' · ' + stats.publicCount + ' ' + plural(stats.publicCount, 'pública', 'públicas')
    }

    function plural(count, singular, many) {
      return count === 1 ? singular : many
    }
  }
})()
