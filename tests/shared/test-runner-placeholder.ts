import { expect, test } from "bun:test";
import { createReadStream, readFileSync } from "fs";
import { Readable } from "stream";

// Expected data URL for the cat.png placeholder
const EXPECTED_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAgCAYAAAD5VeO1AAAMRklEQVR4AQBdAKL/AIh1U/+KdlX/jHhX/497Wv+Sflz/lIBf/5WBYP+UgF//kX5e/4x6W/+GdVj/gHFV/3psU/92alP/c2lW/3NrW/91b2L/eXVr/358dP+Eg37/iYqH/42Pjf+PkZD/AF0Aov8AiXZU/4t3Vf+Nelj/kH1b/5OAXv+WgmD/loNh/5WCYf+Sf1//jXtc/4d2Wf+BcVb/e21U/3ZqVP9zaVb/c2ta/3VuYf94dGr/fXt0/4OCff+JiYb/jY6M/4+Rj/8AXQCi/wCLeFb/jXlX/5B8Wv+Tf13/loJg/5iEYv+ZhWP/mIVj/5WCYf+Qfl7/inhb/4NzV/98blX/d2tU/3RpVv9zalr/dG5g/3hzaf99enL/goJ8/4iIhf+MjYv/jpCO/wBdAKL/AI56WP+QfFn/k35c/5aCX/+ahWP/nIhl/52JZ/+ciGf/mYZl/5SBYf+Ne13/hXVZ/35wVv94bFX/dGpW/3NqWf90bV//d3No/3x5cf+CgXv/h4eD/4uMiv+Oj43/AF0Aov8AkX1a/5N+XP+WgV//moVi/56JZv+hjGn/oo5r/6GNa/+eimn/mIVl/5F/YP+JeFz/gXJY/3ptVv92a1b/dGtZ/3RtX/93cmf/fHlw/4KAev+Hh4L/i4yJ/46PjP8AXQCi/wCUf1z/loFd/5mEYf+eiWX/oo1q/6aRbf+ok2//p5Jv/6OPbf+dimn/loRk/418X/+EdVr/fXBX/3hsV/91bFn/dW5f/3hzZ/99eXD/goB5/4iHgv+MjIn/j4+M/wBdAKL/AJWAXP+Ygl//nIdj/6GMZ/+mkW3/qpVx/62Xc/+sl3T/qZVy/6OPbv+biGj/koBi/4h5Xf+Acln/em5Y/3dtWv93b1//eXRn/356cP+EgXr/ioiD/46Oif+RkY3/AF0Aov8AloFc/5mDX/+diGP/o45p/6mUb/+umXT/sZx3/7GceP+umnb/qJRy/6CNbP+WhWb/jHxg/4R1XP99cVr/eW9b/3lxYP97dWj/gHxx/4aDe/+MioT/kZCL/5OTj/8AXQCi/wCWgFv/mYNe/56IY/+ljmn/q5Vw/7Gbdv+1n3r/tqB7/7Oeev+tmXb/pZFw/5qIaf+Qf2P/h3he/4BzXP98cV3/e3Jh/353af+DfnL/iYV8/4+Nhv+Uk43/l5aR/wBdAKL/AJR+Wf+XgVz/nYdh/6WOaP+slnD/s513/7ihe/+5o37/t6F9/7Gcef+olHP/nots/5OCZf+Jel//gnVd/35zXv99dGL/gHlq/4WAc/+MiH7/ko+I/5eWj/+amZP/AF0Aov8AkntV/5V/Wf+chV//pI1n/6yVb/+0nXb/uaJ8/7ukf/+5o37/s556/6uXdP+gjW3/lYRm/4t8YP+Ddl3/f3Re/351Y/+Bemr/h4F0/46Jf/+Vkon/mpiR/52blf8AXQCi/wCPeFL/k3xW/5mCXP+ii2T/q5Rt/7Ocdf+5onz/vKV//7qkf/+1n3v/rJh1/6GObf+WhGb/jHxg/4R2Xf9/c17/f3Vi/4J6av+IgXT/j4p//5aTiv+cmZL/n52W/wBdAKL/AIx1T/+QeVP/l4BZ/6CJYv+pkmv/spt0/7ihe/+7pH7/uqN+/7Sfev+sl3T/oY5t/5WEZf+Le1//g3Vc/39yXP9+dGH/gXlp/4eBc/+Pin//l5OK/52akv+gnpb/AF0Aov8AinNN/453UP+Vflf/nodg/6iQav+wmXL/t6B5/7qjff+4on3/s515/6qWc/+fjGv/lIJj/4l5Xf+Bc1r/fXFa/3xyX/+AeGf/hoBy/46Jfv+Wkon/nJqR/6Cdlv8AXQCi/wCIckv/jHVP/5N8Vv+chV//po9o/66Xcf+1nnf/uKF7/7age/+xm3f/qJNx/52Kaf+Rf2H/hnda/35wV/96blj/enBd/351Zf+EfnD/jIh8/5WRiP+bmJD/n52V/wBdAKL/AIdxS/+LdU//kntV/5uEXv+kjWf/rJVv/7Kcdf+1nnn/s514/66YdP+lkG7/moZm/458Xv+Dc1j/e21U/3drVf93bVr/e3Nj/4J8bv+Lhnv/k4+G/5qXj/+dm5T/AF0Aov8Ah3FM/4t0T/+Re1X/mYNd/6KMZv+qk27/r5lz/7Gbdv+wmnX/qpVx/6GNa/+Wg2P/inlb/4BwVf94alL/dGhT/3RrWP95cWH/gHpt/4mEev+RjoX/mJaO/5yak/8AXQCi/wCHcU3/inVQ/5B6Vv+Ygl3/oIpl/6eRbP+slnH/rZhz/6uWcv+lkW7/nIlo/5F/YP+GdVj/fG1T/3VoUP9xZlH/cmlX/3dvYP9+eWz/h4N5/5CNhf+XlY7/m5qT/wBdAKL/AIdyTv+JdFH/j3pW/5aAXf+dh2P/o45q/6eSbv+ok3D/ppFv/6CMav+XhWT/jXtd/4JyVv95alH/cmZP/29lUf9waFf/dW9g/314bf+Hg3r/kI2G/5eVj/+bmpT/AF0Aov8AhXFP/4h0Uf+NeFb/k35b/5mEYf+eimf/oo1q/6OObP+gjGr/modm/5KAYf+Id1r/fm9U/3ZoT/9wZE7/bmRR/3BoV/91b2L/fXlu/4eEe/+Qjoj/l5aR/5ublv8AXQCi/wCDcE//hXJR/4l2Vf+Pe1n/lIBf/5mFY/+ciGb/nIhn/5mGZv+UgmL/jXtd/4R0V/97bFL/c2ZP/25jTv9tZFL/b2hZ/3VwZP9+enH/iIV+/5GQi/+YmJT/nJ2Z/wBdAKL/AIBtTv+Cb1D/hXNT/4p3V/+Oe1v/kn9f/5WCYf+VgmL/k4Bh/458Xv+Hdlr/f3BV/3hqUf9xZU//bWNP/21lVP9walz/d3Jn/398dP+JiIL/k5KO/5qbl/+en53/AF0Aov8AfGtM/35sTv+Bb1D/hHJU/4h2V/+LeVr/jXtc/418Xf+Melz/iHda/4JyV/97bVP/dWhQ/3BkT/9tZFH/bmZX/3JsX/94dWv/gX94/4uLhv+VlZL/nJ2c/6Ciof8AXQCi/wB4aEv/emlM/3xrTv9/blH/gnFT/4V0Vv+GdVj/h3ZZ/4V1WP+Cclf/fW9U/3hrUv9zZ1H/b2VR/25lVP9vaFr/dG9k/3t4cP+Eg33/jo6L/5eZl/+eoaD/oqWl/wBdAKL/AHVlSv92Zkv/eGhM/3pqTv99bVH/f29T/4BwVP+BcVX/gHBV/31vVP96bFP/dmlS/3JnUv9wZlT/b2hY/3JsX/92c2n/fnx1/4eHgv+RkpD/mpyc/6Gkpf+kqKn/AF0Aov8Ac2RK/3RlS/91Zkz/d2hN/3lqT/97a1H/fG1S/31uU/98blT/e21U/3hrVP91alT/c2hV/3FpWP9ya1z/dXBk/3p3bv+BgHr/iouI/5SWlf+coKD/o6ep/6errv8AXQCi/wByZEv/c2VM/3RmTP91Z03/dmhP/3hqUP95a1H/emxT/3psVP95bFT/eGxV/3ZrVv91a1n/dGxc/3VvYv94dGr/fnt0/4WFgP+Oj43/l5qa/5+jpf+lqq3/qa6y/wBdAKL/AHNmTv9zZk7/dGZO/3VnT/92aFD/d2lR/3hrUv95bFT/em1V/3ltVv95bVj/eG5a/3duXf93cGH/eXRn/315cP+CgHr/iYmG/5GTkv+anp//oqep/6itsf+rsbb/AF0Aov8AdWhR/3VoUf91aFH/dmlS/3dqUv94a1P/eWxU/3ptVv96blf/e29Z/3twW/96cV7/enJi/3t1Zv99eG3/gX51/4aFf/+Njov/lZeX/52ho/+kqq3/qrC1/62zuf8AXQCi/wB3a1X/d2tV/3drVP93a1T/eGtV/3lsVf96bVb/e29Y/3xwWv99cVz/fXJf/310Yv9+dmb/f3hr/4F8cv+Egnr/iomE/5CRj/+Ym5v/n6Sn/6assf+ssrj/r7a8/wBdAKL/AHltWP95bVf/eW1X/3ltV/95bVf/em5X/3tvWP98cFr/fXJc/35zX/9/dWL/f3Zl/4B5af+BfG//hIB1/4eFfv+MjIf/k5SS/5qdnv+hpqn/qK6z/620uv+wt77/AV0Aov8Aem5Z/3puWf96bln/em5Y/3puWP97b1n/fHBa/31xW/9+c13/f3Rg/4B2Y/+BeGf/gnpr/4N9cP+FgXf/iYeA/46Oif+UlpT/m56g/6Knq/+pr7T/rrW7/7C4v//ZoRN4z/72oQAAAABJRU5ErkJggg==";

type PlaceholderConfig = {
  type: "bun" | "node";
  getImgPlaceholder: (input: any) => Promise<string>;
};

export function runPlaceholderTests(config: PlaceholderConfig) {
  const { type, getImgPlaceholder } = config;

  test(`${type}: getImgPlaceholder returns a data URL when calling the placeholder fn with stream`, async () => {
    const stream = createReadStream("./public/cat.png");
    const placeholder = await getImgPlaceholder(stream);
    expect(placeholder).toBe(EXPECTED_PLACEHOLDER);
  });

  test(`${type}: getImgPlaceholder returns a data URL when calling the placeholder fn with buffer`, async () => {
    const buffer = readFileSync("./public/cat.png");
    const placeholder = await getImgPlaceholder(buffer);
    expect(placeholder).toBe(EXPECTED_PLACEHOLDER);
  });

  test(`${type}: getImgPlaceholder returns a data URL when calling the placeholder fn with web ReadableStream`, async () => {
    const stream = createReadStream("./public/cat.png");
    const webStream = Readable.toWeb(stream);
    const placeholder = await getImgPlaceholder(webStream);
    expect(placeholder).toBe(EXPECTED_PLACEHOLDER);
  });
}
