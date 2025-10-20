(function ($) {
  const queryString = () => {
    const queryObj = {};
    const queryStr = window.location.search.substring(1);
    const queryArr = queryStr.split('&');

    queryArr.forEach(pairStr => {
      const [key, value = ''] = pairStr.split('=');
      if (typeof queryObj[key] === 'undefined') {
        queryObj[key] = value;
      } else if (Array.isArray(queryObj[key])) {
        queryObj[key].push(value);
      } else {
        queryObj[key] = [queryObj[key], value];
      }
    });

    return queryObj;
  };

  const setUrlQuery = (function () {
    const baseUrl = window.location.href.split('?')[0];
    return query => {
      const newUrl = typeof query === 'string' ? `${baseUrl}?${query}` : baseUrl;
      window.history.replaceState(null, '', newUrl);
    };
  })();

  $(document).ready(function () {
    const $tags = $('.js-tags');
    const $articleTags = $tags.find('.tag-button');
    const $tagShowAll = $tags.find('.tag-button--all');
    const $result = $('.js-result');
    const $sections = $result.find('section');
    const sectionArticles = $sections.map((_, section) => $(section).find('.item')).get();
    let $lastFocusButton = null;
    let sectionTopArticleIndex = 0;
    let hasInit = false;
    const itemsPerPage = 10;
    let currentShown = 0;

    function searchButtonsByTag(tag) {
      return tag ? $articleTags.filter(`[data-encode="${tag}"]`) : $tagShowAll;
    }

    function buttonFocus(target) {
      if (target) {
        $lastFocusButton?.removeClass('focus');
        target.addClass('focus');
        $lastFocusButton = target;
      }
    }

    function showNextBatch() {
      const allItems = $result.find('.item');
      const hiddenItems = allItems.filter('.d-none');
      const toShow = hiddenItems.slice(0, itemsPerPage);
      toShow.removeClass('d-none');
      currentShown += toShow.length;
      if (hiddenItems.length <= itemsPerPage) {
        $('#load-more').hide();
      }
    }

    function tagSelect(tag, target) {
      if (!tag) {
        const allItems = $result.find('.item');
        allItems.addClass('d-none');
        currentShown = 0;
        showNextBatch();
        $('#load-more').show();
      } else {
        const sectionVisibility = sectionArticles.map(articles =>
          articles.map(article => $(article).data('tags').split(',').includes(tag))
        );

        $sections.each((i, section) => {
          $(section).toggleClass('d-none', !sectionVisibility[i].some(Boolean));
          sectionArticles[i].each((j, article) => {
            $(article).toggleClass('d-none', !sectionVisibility[i][j]);
          });
        });
        $('#load-more').hide();
      }

      if (!hasInit) {
        $result.removeClass('d-none');
        hasInit = true;
      }

      if (target) {
        buttonFocus(target);
        const _tag = target.attr('data-encode');
        setUrlQuery(_tag ? `tag=${_tag}` : '');
      } else {
        buttonFocus(searchButtonsByTag(tag));
      }
    }

    function init() {
      sectionTopArticleIndex = 0;
      $sections.each((_, section) => {
        sectionTopArticleIndex += $(section).find('.item').length;
      });
    }

    const query = queryString();
    const _tag = query.tag;

    init();
    tagSelect(_tag);

    $tags.on('click', 'a', function () {
      const target = $(this);
      const _tag = target.data('encode');
      if (target.hasClass('focus')) {
        tagSelect('', target);
      } else {
        tagSelect(_tag, target);
      }
    });

    $('#load-more').on('click', showNextBatch);
  });
})(jQuery);